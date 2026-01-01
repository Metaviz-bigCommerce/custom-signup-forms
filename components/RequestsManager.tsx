'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { XCircle, Search, Mail } from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import RequestDetailsModal, { RequestItem as ModalRequestItem } from '@/components/requests/RequestDetailsModal';
import ApprovalDialog from '@/components/requests/ApprovalDialog';

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
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<RequestItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const pageSize = 10;

  // Approval dialog state
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestInfoText, setRequestInfoText] = useState('');
  const [requestInfoTargetId, setRequestInfoTargetId] = useState<string | null>(null);
  const [sendingInfoRequest, setSendingInfoRequest] = useState(false);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | 'info' | 'delete' | null>(null);
  const toast = useToast();

  const load = async (cursor?: string | null, replace = false) => {
    if (!context) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('pageSize', String(pageSize));
      if (cursor) params.set('cursor', cursor);
      if (statusFilter) params.set('status', statusFilter);
      params.set('context', context);
      const res = await fetch(`/api/signup-requests?` + params.toString());
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      
      // Handle new standardized response format
      const responseData = json.error === false && json.data ? json.data : json;
      const items = responseData.items || [];
      const nextCursor = responseData.nextCursor || null;
      
      const newItems = replace ? items : [...allItems, ...items];
      setAllItems(newItems);
      setNextCursor(nextCursor);
      
      // If loading more items (not replacing), increase displayedCount to show new items
      if (!replace && items.length > 0) {
        setDisplayedCount(prev => prev + items.length);
      }
    } catch (e) {
      // noop simple UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load and when filter changes
    setAllItems([]);
    setNextCursor(null);
    setDisplayedCount(12); // Reset displayed count when filter changes
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, context]);

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
        toast.showSuccess(`Request status updated to ${newStatus}.`);
      } else {
        const errorText = await res.text();
        toast.showError('Failed to update status: ' + errorText);
      }
    } catch (error: unknown) {
      toast.showError('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'));
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

  const revertToPending = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revert to Pending',
      message: 'This will change the request status back to pending. Are you sure?',
      onConfirm: () => {
        updateStatus(id, 'pending');
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };
  const openRequestInfoModal = (id: string) => {
    setRequestInfoTargetId(id);
    setRequestInfoText('');
    setShowRequestInfoModal(true);
  };

  const requestInfo = async () => {
    if (!context || !requestInfoTargetId || !requestInfoText.trim()) {
      toast.showWarning('Please enter the information you need from the user.');
      return;
    }
    setSendingInfoRequest(true);
    setActionLoading('info');
    try {
      const res = await fetch(`/api/signup-requests/info-request?id=${encodeURIComponent(requestInfoTargetId)}&context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required_information: requestInfoText.trim() }),
      });
      if (res.ok) {
        toast.showSuccess('Info request email sent (if email configured).');
        setShowRequestInfoModal(false);
        setRequestInfoText('');
        setRequestInfoTargetId(null);
      } else {
        const errorText = await res.text();
        toast.showError('Failed to send info request: ' + errorText);
      }
    } catch (error: unknown) {
      toast.showError('Failed to send info request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSendingInfoRequest(false);
      setActionLoading(null);
    }
  };

  const formatDate = (ts?: any) => {
    if (!ts) return '';
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000).toLocaleString();
    return '';
    };

  const extractName = (data: Record<string, any>): string => {
    const entries = Object.entries(data || {});
    const candidates = ['name', 'full_name', 'full name', 'first_name', 'first name'];
    for (const key of candidates) {
      const found = entries.find(([k]) => k.toLowerCase() === key);
      if (found) return String(found[1] ?? '');
    }
    const fuzzy = entries.find(([k]) => /name/i.test(k));
    if (fuzzy) return String(fuzzy[1] ?? '');
    return '';
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

  const extractEmail = (item: RequestItem): string => {
    if (item.email) return item.email;
    const entries = Object.entries(item.data || {});
    const candidates = ['email', 'e-mail', 'email_address', 'email address'];
    for (const key of candidates) {
      const found = entries.find(([k]) => k.toLowerCase() === key);
      if (found) return String(found[1] ?? '');
    }
    const fuzzy = entries.find(([k]) => /email/i.test(k));
    if (fuzzy) return String(fuzzy[1] ?? '');
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

  // Pagination: show only first displayedCount items
  const displayedItems = filteredItems.slice(0, displayedCount);
  const hasMore = filteredItems.length > displayedCount;

  // Reset displayed count when search filter changes (but not when status filter changes, as that's handled above)
  useEffect(() => {
    if (searchFilter !== '') {
      setDisplayedCount(12);
    }
  }, [searchFilter]);

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 12);
  };
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
        setSelected(null);
        // Reload first page to reflect deletion quickly
        setAllItems([]);
        setNextCursor(null);
        await load(null, true);
        toast.showSuccess('Request deleted successfully.');
      } else {
        const errorText = await res.text();
        toast.showError('Failed to delete request: ' + errorText);
      }
    } catch (error: unknown) {
      toast.showError('Failed to delete request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Signup Requests</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage and review all signup submissions</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setStatusFilter('')} 
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                statusFilter === '' 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('pending')} 
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                statusFilter === 'pending' 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
              }`}
            >
              Pending
            </button>
            <button 
              onClick={() => setStatusFilter('approved')} 
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                statusFilter === 'approved' 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
              }`}
            >
              Approved
            </button>
            <button 
              onClick={() => setStatusFilter('rejected')} 
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
                statusFilter === 'rejected' 
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
              }`}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <Search className="w-4 h-4 shrink-0" />
            <span className="font-medium">Search:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchFilter && (
              <div className="text-xs text-gray-600 whitespace-nowrap sm:self-center">
                <span className="font-semibold text-gray-900">{displayedItems.length}</span> of <span className="font-semibold text-gray-900">{filteredItems.length}</span> results
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden">
          {displayedItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {displayedItems.map(request => {
                const name = extractName(request.data);
                const email = extractEmail(request);
                return (
                  <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{name || '—'}</h3>
                        <p className="text-xs text-gray-600 truncate mt-0.5">{email || '—'}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${
                        request.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        request.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">{formatDate(request.submittedAt)}</p>
                      <button 
                        onClick={() => setSelected(request)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              {allItems.length === 0 ? 'No requests found.' : 'No requests match your filters.'}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedItems.map(request => {
                const name = extractName(request.data);
                const email = extractEmail(request);
                return (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium text-gray-900">{name || '—'}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{email || '—'}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{formatDate(request.submittedAt)}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${
                        request.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        request.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                      <button 
                        onClick={() => setSelected(request)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!displayedItems.length && !loading && (
                <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>
                  {allItems.length === 0 ? 'No requests found.' : 'No requests match your filters.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 sm:p-4 border-t border-gray-100">
          {/* Count Display */}
          {allItems.length > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
              <span className="font-medium">
                Showing <span className="text-slate-900 font-semibold">{displayedItems.length}</span> out of{' '}
                <span className="text-slate-900 font-semibold">{filteredItems.length}</span> requests
              </span>
            </div>
          )}

          {/* Load More Button - Only show if there are more items to display from already loaded items */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLoadMore();
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto"
              >
                Load More
              </button>
            </div>
          )}

          {/* API Load More Button - Only show if all loaded items are displayed and there are more items from API */}
          {!hasMore && nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  load(nextCursor || undefined);
                }}
                disabled={loading || !nextCursor}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 w-full sm:w-auto ${nextCursor && !loading ? 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                {loading ? 'Loading…' : 'Load More from Server'}
              </button>
            </div>
          )}
        </div>
      </div>

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
      {showRequestInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
              <div className="text-base sm:text-lg font-bold text-gray-900">Request Information from User</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Enter the information you need from the user. An email will be sent if email is configured.</div>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-5 flex-1 overflow-y-auto">
              <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-2">
                Required Information
              </label>
              <textarea
                value={requestInfoText}
                onChange={(e) => setRequestInfoText(e.target.value)}
                placeholder="e.g., Please provide additional documentation for verification..."
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                rows={4}
                autoFocus
              />
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowRequestInfoModal(false);
                  setRequestInfoText('');
                  setRequestInfoTargetId(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors text-xs sm:text-sm font-medium"
                disabled={sendingInfoRequest}
              >
                Cancel
              </button>
              <button
                onClick={requestInfo}
                disabled={sendingInfoRequest || !requestInfoText.trim()}
                className="w-full sm:flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {sendingInfoRequest ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManager;

