'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { getUserFriendlyError } from '@/lib/utils';
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

type QuickAction = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  hoverGradient: string;
  hidden?: boolean;
};

const Dashboard: React.FC = () => {
  const { context } = useSession();
  const router = useRouter();
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

  const handleStatCardClick = (status: '' | 'pending' | 'approved' | 'rejected') => {
    const contextParam = context ? `context=${context}` : '';
    const statusParam = status ? `&status=${status}` : '';
    router.push(`/requests?${contextParam}${statusParam}`);
  };

  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, trend: null as string | null, trendUp: true });
  const [animatedStats, setAnimatedStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const animatedStatsRef = useRef(animatedStats);

  // Update ref when animatedStats changes
  useEffect(() => {
    animatedStatsRef.current = animatedStats;
  }, [animatedStats]);

  // Animate stats on load and updates
  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const interval = duration / steps;
    let step = 0;
    
    // Start from current animated values (from ref to avoid stale closure)
    const startValues = { ...animatedStatsRef.current };
    const endValues = { ...stats };
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        total: Math.round(startValues.total + (endValues.total - startValues.total) * easeOut),
        pending: Math.round(startValues.pending + (endValues.pending - startValues.pending) * easeOut),
        approved: Math.round(startValues.approved + (endValues.approved - startValues.approved) * easeOut),
        rejected: Math.round(startValues.rejected + (endValues.rejected - startValues.rejected) * easeOut),
      });
      
      if (step >= steps) {
        clearInterval(timer);
        // Ensure final values are exact
        setAnimatedStats(endValues);
      }
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
    // Close modal first, then toast will be shown by ApprovalDialog
    setSelectedRequest(null);
    setShowApproveDialog(false);
    setApproveTargetId(null);
    await loadSignupRequests();
    await loadStats();
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
        // Close modal first, then show success toast
        setSelectedRequest(null);
        await loadSignupRequests();
        await loadStats();
        // Use setTimeout to ensure modal closes before toast is shown
        setTimeout(() => {
          toast.showSuccess('Request rejected.');
        }, 100);
      } else {
        const errorText = await res.text();
        // Keep modal open on failure and show error toast
        toast.showError(getUserFriendlyError(errorText, 'Unable to reject the request. Please try again.'));
      }
    } catch (error: unknown) {
      // Keep modal open on failure and show error toast
      toast.showError(getUserFriendlyError(error, 'Unable to reject the request. Please try again.'));
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
        // Close modal first, then show success toast
        setSelectedRequest(null);
        await loadSignupRequests();
        await loadStats();
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
      trend: stats.trend,
      trendUp: stats.trendUp,
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

  const quickActions: QuickAction[] = [
    {
      href: `/builder?context=${context}&tab=2`,
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
      href: `/builder/preview?context=${context}`,
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
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-lg sm:rounded-xl md:rounded-2xl mb-5 sm:mb-6 md:mb-8 p-3.5 sm:p-4 md:p-6 lg:p-8">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 sm:-top-40 sm:-right-40 w-64 h-64 sm:w-80 sm:h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 sm:-bottom-40 sm:-left-40 w-64 h-64 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex-1 min-w-0 overflow-visible">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-white/90 font-medium whitespace-nowrap">Custom Signup Forms Dashboard</span>
                </div>
              </div>
              <h1 className="text-[12px] min-[360px]:text-[17px] min-[390px]:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold !text-white mb-2 sm:mb-3 leading-tight overflow-visible">
                <span className="whitespace-nowrap inline-flex items-center overflow-visible">Welcome back!<span className="inline-block ml-1 overflow-visible">👋</span></span>
              </h1>
              <p className="text-blue-200 text-xs sm:text-sm md:text-base lg:text-lg max-w-xl leading-relaxed">
                Here&apos;s what&apos;s happening with your signup forms today. You have{' '}
                <span className="text-white font-semibold">{stats.pending} pending</span> requests awaiting review.
              </p>
            </div>
            <Link 
              href={`/builder?context=${context}&tab=2`}
              className="group relative overflow-hidden bg-white text-slate-900 px-4 sm:px-5 lg:px-6 py-3 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/30 flex items-center justify-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 shrink-0 w-full lg:w-auto"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
              
              {/* Plus icon with rotation animation */}
              <div className="relative z-10">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 group-hover:rotate-90 group-hover:scale-110" />
              </div>
              
              <span className="relative z-10 transition-all duration-300 group-hover:tracking-wide whitespace-nowrap">Create New Form</span>
              
              {/* Arrow with slide animation */}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 opacity-0 lg:opacity-100 -translate-x-4 lg:translate-x-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-5 sm:mb-6 md:mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          // Map card id to status filter
          const statusFilter = card.id === 'pending' ? 'pending' : card.id === 'approved' ? 'approved' : card.id === 'rejected' ? 'rejected' : '';
          return (
            <div
              key={card.id}
              onClick={() => handleStatCardClick(statusFilter)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative overflow-hidden bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-100 p-3.5 sm:p-4 md:p-5 lg:p-6 transition-all duration-500 cursor-pointer
                ${hoveredCard === card.id ? 'scale-[1.02] shadow-xl shadow-gray-200/50' : 'shadow-sm hover:shadow-md'}`}
            >
              {/* Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 transition-opacity duration-500 ${hoveredCard === card.id ? 'opacity-100' : ''}`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2.5 sm:mb-3 md:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg transition-transform duration-500 ${hoveredCard === card.id ? 'scale-110 rotate-3' : ''}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  {card.trend && (
                    <div className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold shrink-0 ${card.trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <TrendingUp className={`w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 ${!card.trendUp && 'rotate-180'}`} />
                      <span className="whitespace-nowrap">{card.trend}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tabular-nums leading-tight">
                    {card.value.toLocaleString()}
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-600 leading-snug">{card.label}</div>
                  {card.subtitle && (
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-snug">{card.subtitle}</div>
                  )}
                </div>
              </div>
              
              {/* Decorative Element */}
              <div className={`absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 transition-all duration-500 ${hoveredCard === card.id ? 'scale-150 opacity-20' : ''}`} />
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-5 sm:mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-0.5 sm:mt-1">Shortcuts to frequently used features</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-500 shrink-0">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-yellow-500 shrink-0" />
            <span className="hidden md:inline">Pro tip: Use keyboard shortcuts for faster navigation</span>
            <span className="hidden sm:inline md:hidden">Pro tip: Use shortcuts</span>
            <span className="sm:hidden">Pro tip</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
          {quickActions.filter(action => !action.hidden).map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-gray-100 p-3.5 sm:p-4 md:p-5 lg:p-6 transition-all duration-300 ease-out will-change-transform hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 active:scale-[0.98]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 ease-out`} />
                
                <div className="relative z-10">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.gradient} ${action.hoverGradient} flex items-center justify-center mb-2.5 sm:mb-3 md:mb-4 transition-all duration-300 ease-out will-change-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg`}>
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-6 lg:h-6 text-white transition-transform duration-300 ease-out" />
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 mb-0.5 sm:mb-1 group-hover:text-gray-800 truncate transition-colors duration-300 ease-out">{action.title}</h3>
                      <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 line-clamp-2 leading-snug transition-colors duration-300 ease-out group-hover:text-gray-600">{action.description}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-300 ease-out shrink-0 will-change-transform" />
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
            className="group relative overflow-hidden flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg sm:rounded-xl font-medium text-xs sm:text-[13px] tracking-tight transition-all duration-500 ease-out hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 w-full sm:w-auto"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            <span className="relative z-10 transition-all duration-300 group-hover:font-semibold whitespace-nowrap">View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 transition-all duration-500 ease-out group-hover:translate-x-2 group-hover:scale-110" />
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
        onSent={(id) => {
          // Close RequestDetailsModal first when info request is successfully sent
          // The toast is already shown by RequestInfoModal
          setSelectedRequest(null);
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
