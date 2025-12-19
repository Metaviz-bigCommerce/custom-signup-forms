'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Clock, TrendingUp, ArrowRight,
  Settings, Sparkles, Zap, ChevronRight,
  UserCheck, UserX,
  FileText,
  Mail,
  Eye,
  Users
} from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import RequestDetailsModal, { RequestItem as ModalRequestItem } from '@/components/requests/RequestDetailsModal';
import ApprovalDialog from '@/components/requests/ApprovalDialog';
import RequestInfoModal from '@/components/requests/RequestInfoModal';
import RequestsTable, { RequestTableItem } from '@/components/requests/RequestsTable';

type SignupRequestItem = {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
  email?: string | null;
  files?: Array<{ name: string; url: string; contentType?: string; size?: number }>;
};


const Dashboard: React.FC = () => {
  const { context } = useSession();
  const [allRequests, setAllRequests] = useState<SignupRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequestItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | 'info' | 'delete' | null>(null);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [requestInfoTargetId, setRequestInfoTargetId] = useState<string | null>(null);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const toast = useToast();

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [animatedStats, setAnimatedStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Animate stats on load
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        total: Math.round(stats.total * easeOut),
        pending: Math.round(stats.pending * easeOut),
        approved: Math.round(stats.approved * easeOut),
        rejected: Math.round(stats.rejected * easeOut),
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, [stats]);

  const loadStats = async () => {
    if (!context) {
      setLoading(false);
      setError('No context available');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/signup-requests/stats?context=${encodeURIComponent(context)}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', res.status, errorText);
        setError(`Failed to load stats: ${res.status}`);
        return;
      }
      const json = await res.json();
      if (json.error === false && json.data) {
        setStats(json.data);
      }
    } catch (e: unknown) {
      console.error('Failed to load stats:', e);
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const loadSignupRequests = async () => {
    if (!context) return;
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '5');
      params.set('context', context);
      const res = await fetch(`/api/signup-requests?` + params.toString());
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', res.status, errorText);
        return;
      }
      const json = await res.json();
      if (json.error === false && json.data) {
        const items: SignupRequestItem[] = json.data.items || [];
        setAllRequests(items);
      }
    } catch (e: unknown) {
      console.error('Failed to load signup requests:', e);
    }
  };

  const openApproveDialog = (id: string) => {
    setApproveTargetId(id);
    setShowApproveDialog(true);
  };

  const handleApprovalComplete = async (id: string) => {
    await loadSignupRequests();
    await loadStats();
    setSelectedRequest(null);
    setShowApproveDialog(false);
    setApproveTargetId(null);
  };

  const reject = async (id: string) => {
    if (!context || actionLoading) return;
    setActionLoading('reject');
    try {
      const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      if (res.ok) {
        await loadSignupRequests();
        await loadStats();
        setSelectedRequest(null);
        toast.showSuccess('Request rejected.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const openRequestInfoModal = (id: string) => {
    setRequestInfoTargetId(id);
    setShowRequestInfoModal(true);
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
        setSelectedRequest(null);
        await loadSignupRequests();
        await loadStats();
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

  useEffect(() => {
    loadStats();
    loadSignupRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  const statCards = [
    {
      id: 'total',
      label: 'Total Signups',
      value: animatedStats.total,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      id: 'pending',
      label: 'Pending Review',
      value: animatedStats.pending,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-100',
      iconBg: 'bg-amber-500',
      subtitle: 'Awaiting action',
    },
    {
      id: 'approved',
      label: 'Approved',
      value: animatedStats.approved,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-100',
      iconBg: 'bg-emerald-500',
      subtitle: `${approvalRate}% approval rate`,
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: animatedStats.rejected,
      icon: UserX,
      gradient: 'from-rose-500 to-red-500',
      bgGradient: 'from-rose-50 to-red-100',
      iconBg: 'bg-rose-500',
    },
  ];

  const quickActions = [
    {
      href: `/builder?context=${context}`,
      icon: Settings,
      title: 'Form Builder',
      description: 'Design beautiful signup forms',
      gradient: 'from-violet-500 to-purple-600',
      hoverGradient: 'group-hover:from-violet-600 group-hover:to-purple-700',
    },
    {
      href: `/requests?context=${context}`,
      icon: FileText,
      title: 'View Requests',
      description: 'Manage all submissions',
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'group-hover:from-blue-600 group-hover:to-cyan-600',
    },
    {
      href: `/emails?context=${context}`,
      icon: Mail,
      title: 'Email Templates',
      description: 'Customize notifications',
      gradient: 'from-pink-500 to-rose-500',
      hoverGradient: 'group-hover:from-pink-600 group-hover:to-rose-600',
    },
    {
      href: `/preview?context=${context}`,
      icon: Eye,
      title: 'Preview Form',
      description: 'See how it looks live',
      gradient: 'from-teal-500 to-emerald-500',
      hoverGradient: 'group-hover:from-teal-600 group-hover:to-emerald-600',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl mb-8 p-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white/90 font-medium">SignupPro Dashboard</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold !text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-blue-200 text-lg max-w-xl">
                Here&apos;s what&apos;s happening with your signup forms today. You have{' '}
                <span className="text-white font-semibold">{stats.pending} pending</span> requests awaiting review.
              </p>
            </div>
            <Link 
              href={`/builder?context=${context}`}
              className="group relative overflow-hidden bg-white text-slate-900 px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Create New Form</span>
              <ArrowRight className="w-4 h-4 relative z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-500 cursor-pointer
                ${hoveredCard === card.id ? 'scale-[1.02] shadow-xl shadow-gray-200/50' : 'shadow-sm hover:shadow-md'}`}
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 transition-opacity duration-500 ${hoveredCard === card.id ? 'opacity-100' : ''}`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg transition-transform duration-500 ${hoveredCard === card.id ? 'scale-110 rotate-3' : ''}`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {card.trend && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${card.trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <TrendingUp className={`w-3 h-3 ${!card.trendUp && 'rotate-180'}`} />
                      {card.trend}
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="text-4xl font-bold text-gray-900 tabular-nums">
                    {card.value.toLocaleString()}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{card.label}</div>
                  {card.subtitle && (
                    <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
                  )}
                </div>
              </div>
              
              {/* Decorative Element */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 transition-all duration-500 ${hoveredCard === card.id ? 'scale-150 opacity-20' : ''}`} />
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-gray-500 mt-1">Shortcuts to frequently used features</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Pro tip: Use keyboard shortcuts for faster navigation</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-800">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Requests Table */}
      <RequestsTable
        requests={allRequests.slice(0, 5) as RequestTableItem[]}
        loading={loading}
        emptyMessage="No requests yet"
        emptySubMessage="When users submit your signup form, they'll appear here."
        onViewRequest={(request) => setSelectedRequest(request as SignupRequestItem)}
        showHeader={true}
        headerTitle="Recent Signup Requests"
        headerSubtitle="Latest submissions requiring your attention"
        headerAction={
          <Link 
            href={`/requests?context=${context}`}
            className="group flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium text-[13px] tracking-tight transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        }
      />

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest as ModalRequestItem}
          onClose={() => setSelectedRequest(null)}
          onApprove={(id) => openApproveDialog(id)}
          onReject={(id) => reject(id)}
          onRequestInfo={(id) => openRequestInfoModal(id)}
          onDelete={(id) => remove(id)}
          actionLoading={actionLoading}
          showToast={(msg) => toast.showSuccess(msg)}
        />
      )}

      {/* Approval Dialog */}
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

      {/* Request Info Modal */}
      <RequestInfoModal
        isOpen={showRequestInfoModal}
        requestId={requestInfoTargetId}
        context={context || ''}
        onClose={() => {
          setShowRequestInfoModal(false);
          setRequestInfoTargetId(null);
        }}
        showToast={{
          success: (msg) => toast.showSuccess(msg),
          error: (msg) => toast.showError(msg),
          warning: (msg) => toast.showWarning(msg),
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
    </div>
  );
};

export default Dashboard;
