'use client'

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, Search } from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getUserFriendlyError } from '@/lib/utils';
import RequestDetailsModal, { RequestItem as ModalRequestItem } from '@/components/requests/RequestDetailsModal';
import ApprovalDialog from '@/components/requests/ApprovalDialog';
import RequestInfoModal from '@/components/requests/RequestInfoModal';
import RequestsTable, { RequestTableItem } from '@/components/requests/RequestsTable';

type RequestItem = {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
  email?: string | null;
  files?: Array<{ name: string; url: string; contentType?: string; size?: number }>;
};

const RequestsManager: React.FC = () => {
  const { context } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<RequestItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  // Initialize statusFilter from URL params
  const initialStatusFilter = (searchParams.get('status') as '' | 'pending' | 'approved' | 'rejected') || '';
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>(initialStatusFilter);
  const [searchFilter, setSearchFilter] = useState('');
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const pageSize = 12;

  // Approval dialog state
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoTargetId, setRequestInfoTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | 'info' | 'delete' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Keyboard shortcut: ⌘K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const load = useCallback(async (cursor?: string | null, replace = false) => {
    if (!context) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('pageSize', String(pageSize));
      if (cursor) params.set('cursor', cursor);
      if (statusFilter) params.set('status', statusFilter);
      params.set('context', context);
      
      console.log('[RequestsManager] Loading with params:', Object.fromEntries(params.entries()));
      
      const res = await fetch(`/api/signup-requests?` + params.toString());
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      
      // Handle new standardized response format
      const responseData = json.error === false && json.data ? json.data : json;
      const items = responseData.items || [];
      const nextCursor = responseData.nextCursor || null;
      
      console.log('[RequestsManager] Loaded items:', items.length, 'statusFilter:', statusFilter);
      
      setAllItems(prevItems => replace ? items : [...prevItems, ...items]);
      setNextCursor(nextCursor);
    } catch (e) {
      console.error('[RequestsManager] Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [context, statusFilter, pageSize]);

  useEffect(() => {
    // initial load and when filter changes
    setAllItems([]);
    setNextCursor(null);
    load(null, true);
  }, [load]);

  const openApproveDialog = (id: string) => {
    setApproveTargetId(id);
    setShowApproveDialog(true);
  };

  const handleApprovalComplete = (id: string) => {
    setAllItems(allItems.map(it => it.id === id ? { ...it, status: 'approved' } : it));
    if (selected && selected.id === id) {
      setSelected({ ...selected, status: 'approved' });
    }
    setShowApproveDialog(false);
    setApproveTargetId(null);
    // Close the RequestDetailsModal first, then toast will be shown by ApprovalDialog
    setSelected(null);
  };
  const updateStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!context) return;
    setActionLoading(newStatus === 'rejected' ? 'reject' : null);
    try {
      const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAllItems(allItems.map(it => it.id === id ? { ...it, status: newStatus } : it));
        if (selected && selected.id === id) {
          setSelected({ ...selected, status: newStatus });
        }
        // Close modal first, then show success toast
        setSelected(null);
        // Use setTimeout to ensure modal closes before toast is shown
        setTimeout(() => {
          toast.showSuccess(`Request status updated to ${newStatus}.`);
        }, 100);
      } else {
        const errorText = await res.text();
        // Keep modal open on failure and show error toast
        toast.showError(getUserFriendlyError(errorText, 'Unable to update the request status. Please try again.'));
      }
    } catch (error: unknown) {
      // Keep modal open on failure and show error toast
      toast.showError(getUserFriendlyError(error, 'Unable to update the request status. Please try again.'));
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Request',
      message: 'Are you sure you want to reject this request? The user will be notified via email if email is configured.',
      onConfirm: () => {
        updateStatus(id, 'rejected');
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const openRequestInfoModal = (id: string) => {
    setRequestInfoTargetId(id);
    setShowRequestInfoModal(true);
  };

  const extractNameForFilter = (data: Record<string, any>): string => {
    const entries = Object.entries(data || {});
    const candidates = ['name', 'full_name', 'full name', 'first_name', 'first name'];
    for (const key of candidates) {
      const found = entries.find(([k]) => k.toLowerCase() === key);
      if (found) return String(found[1] ?? '').toLowerCase();
    }
    const fuzzy = entries.find(([k]) => /name/i.test(k));
    if (fuzzy) return String(fuzzy[1] ?? '').toLowerCase();
    return '';
  };

  const extractEmailForFilter = (item: RequestItem): string => {
    if (item.email) return item.email.toLowerCase();
    const entries = Object.entries(item.data || {});
    const candidates = ['email', 'e-mail', 'email_address', 'email address'];
    for (const key of candidates) {
      const found = entries.find(([k]) => k.toLowerCase() === key);
      if (found) return String(found[1] ?? '').toLowerCase();
    }
    const fuzzy = entries.find(([k]) => /email/i.test(k));
    if (fuzzy) return String(fuzzy[1] ?? '').toLowerCase();
    return '';
  };

  // Filter items based on search criteria
  const filteredItems = useMemo(() => {
    if (!allItems || !Array.isArray(allItems)) return [];
    let filtered = allItems;
    
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase();
      filtered = filtered.filter(item => {
        const name = extractNameForFilter(item.data);
        const email = extractEmailForFilter(item);
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }
    
    return filtered;
  }, [allItems, searchFilter]);
  const remove = async (id: string) => {
    if (!context) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Request',
      message: 'Are you sure you want to delete this request? This action cannot be undone.',
      onConfirm: async () => {
        await performDelete(id);
      }
    });
  };

  const performDelete = async (id: string) => {
    if (!context) return;
    setActionLoading('delete');
    try {
      const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Close modal first, then show success toast
        setSelected(null);
        // Reload first page to reflect deletion quickly
        setAllItems([]);
        setNextCursor(null);
        await load(null, true);
        // Use setTimeout to ensure modal closes before toast is shown
        setTimeout(() => {
          toast.showSuccess('Request deleted successfully.');
        }, 100);
      } else {
        const errorText = await res.text();
        // Keep modal open on failure and show error toast
        toast.showError(getUserFriendlyError(errorText, 'Unable to delete the request. Please try again.'));
      }
    } catch (error: unknown) {
      // Keep modal open on failure and show error toast
      toast.showError(getUserFriendlyError(error, 'Unable to delete the request. Please try again.'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 md:p-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h1 className="text-lg min-[361px]:text-xl sm:text-2xl font-bold !text-white whitespace-nowrap min-[361px]:whitespace-normal">Signup Requests</h1>
                  <p className="text-slate-400 text-xs sm:text-sm">Manage and review all signup submissions</p>
                </div>
              </div>
            </div>
            
            {/* Status Filter Pills */}
            <div className="flex flex-nowrap min-[361px]:flex-wrap gap-1.5 min-[361px]:gap-2 overflow-x-auto min-[361px]:overflow-x-visible -mx-1 min-[361px]:mx-0 px-1 min-[361px]:px-0">
              <button 
                onClick={() => setStatusFilter('')} 
                className={`px-2 min-[361px]:px-3 sm:px-4 py-1 min-[361px]:py-1.5 sm:py-2 text-[10px] min-[361px]:text-xs sm:text-sm font-medium rounded-lg min-[361px]:rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === '' 
                    ? 'bg-white text-slate-900 shadow-lg shadow-white/25' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setStatusFilter('pending')} 
                className={`px-2 min-[361px]:px-3 sm:px-4 py-1 min-[361px]:py-1.5 sm:py-2 text-[10px] min-[361px]:text-xs sm:text-sm font-medium rounded-lg min-[361px]:rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === 'pending' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/20'
                }`}
              >
                Pending
              </button>
              <button 
                onClick={() => setStatusFilter('approved')} 
                className={`px-2 min-[361px]:px-3 sm:px-4 py-1 min-[361px]:py-1.5 sm:py-2 text-[10px] min-[361px]:text-xs sm:text-sm font-medium rounded-lg min-[361px]:rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === 'approved' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20'
                }`}
              >
                Approved
              </button>
              <button 
                onClick={() => setStatusFilter('rejected')} 
                className={`px-2 min-[361px]:px-3 sm:px-4 py-1 min-[361px]:py-1.5 sm:py-2 text-[10px] min-[361px]:text-xs sm:text-sm font-medium rounded-lg min-[361px]:rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  statusFilter === 'rejected' 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                    : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <div className="absolute left-3 sm:left-4 z-10 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 sm:pl-12 pr-12 sm:pr-16 py-2.5 sm:py-3.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
                {searchFilter ? (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-3 sm:right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <div className="absolute right-3 sm:right-4 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                    <span className="text-xs text-slate-500">⌘K</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Results Indicator */}
            {searchFilter && (
              <div className="mt-2 sm:mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs sm:text-sm text-slate-300">
                  Found <span className="font-semibold text-white">{filteredItems.length}</span> of{' '}
                  <span className="font-semibold text-white">{allItems.length}</span> results
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <RequestsTable
        requests={filteredItems as RequestTableItem[]}
        loading={loading}
        emptyMessage={allItems.length === 0 ? 'No requests found' : 'No requests match your filters'}
        emptySubMessage={allItems.length === 0 ? 'When users submit your signup form, they\'ll appear here.' : 'Try adjusting your search or filter criteria.'}
        onViewRequest={(request) => setSelected(request as RequestItem)}
        skeletonRows={12}
        footer={
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-slate-500">
              {filteredItems.length} {filteredItems.length === 1 ? 'request' : 'requests'} shown
              {filteredItems.length !== allItems.length && ` (${allItems.length} total loaded)`}
            </div>
            <button
              onClick={() => load(nextCursor || undefined)}
              disabled={loading || !nextCursor}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                nextCursor 
                  ? 'bg-slate-800 text-white hover:bg-slate-900 hover:shadow-lg hover:shadow-slate-500/25 hover:scale-105 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Loading…' : (nextCursor ? 'Load More' : 'No More')}
            </button>
          </div>
        }
      />

      {selected && (
        <RequestDetailsModal
          request={selected as ModalRequestItem}
          onClose={() => setSelected(null)}
          onApprove={(id) => openApproveDialog(id)}
          onReject={(id) => reject(id)}
          onRequestInfo={(id) => openRequestInfoModal(id)}
          onDelete={(id) => remove(id)}
          actionLoading={actionLoading}
          showToast={(msg) => toast.showSuccess(msg)}
        />
      )}
      <ApprovalDialog
        isOpen={showApproveDialog}
        requestId={approveTargetId}
        context={context || ''}
        onClose={() => {
          setShowApproveDialog(false);
          setApproveTargetId(null);
        }}
        onApproved={handleApprovalComplete}
        showToast={{
          success: (msg) => toast.showSuccess(msg),
          error: (msg) => toast.showError(msg),
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      {/* Request Info Modal */}
      <RequestInfoModal
        isOpen={showRequestInfoModal}
        requestId={requestInfoTargetId}
        context={context || ''}
        onClose={() => {
          setShowRequestInfoModal(false);
          setRequestInfoTargetId(null);
        }}
        onSent={(id) => {
          // Close RequestDetailsModal first when info request is successfully sent
          // The toast is already shown by RequestInfoModal
          setSelected(null);
        }}
        showToast={{
          success: (msg) => toast.showSuccess(msg),
          error: (msg) => toast.showError(msg),
          warning: (msg) => toast.showWarning(msg),
        }}
      />
    </div>
  );
};

export default RequestsManager;

