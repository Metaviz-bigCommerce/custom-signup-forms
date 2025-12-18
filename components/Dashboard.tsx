'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Check, X, Users, Clock, TrendingUp, ArrowRight, Eye, Mail, 
  Settings, Trash2, Sparkles, BarChart3, FileText, Zap, ChevronRight,
  UserCheck, UserX, Activity, Calendar, Copy, Download, ExternalLink,
  Search, ChevronDown, ChevronUp, Shield, AlertCircle, CheckCircle2,
  XCircle, RotateCcw, MessageSquare, Paperclip
} from 'lucide-react';
import { useSession } from '@/context/session';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDate, extractName, extractEmail } from '@/lib/utils';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

type SignupRequestItem = {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
  email?: string | null;
  files?: Array<{ name: string; url: string; contentType?: string; size?: number }>;
};

// Avatar gradient colors - attractive and diverse
const avatarGradients = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-500',
  'from-teal-500 to-cyan-500',
];

// Get consistent gradient based on name/id
const getAvatarGradient = (name: string, id: string) => {
  const str = name || id;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
};

// Format date to relative time only (e.g., "17 hours ago", "2 days ago")
const formatRelativeTime = (dateVal: { seconds?: number; nanoseconds?: number } | string | undefined): string => {
  if (!dateVal) return '—';
  
  let date: Date;
  if (typeof dateVal === 'string') {
    date = new Date(dateVal);
  } else if (dateVal.seconds) {
    date = new Date(dateVal.seconds * 1000);
  } else {
    return '—';
  }
  
  if (isNaN(date.getTime())) return '—';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  // Just now / seconds
  if (diffSecs < 60) return 'Just now';
  
  // Minutes
  if (diffMins < 60) {
    return diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`;
  }
  
  // Hours
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  // Days
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  // Weeks
  if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  }
  
  // Months
  if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }
  
  // Years
  const diffYears = Math.floor(diffDays / 365);
  return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
};

const Dashboard: React.FC = () => {
  const { context } = useSession();
  const [allRequests, setAllRequests] = useState<SignupRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequestItem | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsSearch, setDetailsSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const toast = useToast();

  const isImage = (f?: { url?: string; contentType?: string }) => {
    const t = (f?.contentType || '').toLowerCase();
    if (t.startsWith('image/')) return true;
    const u = (f?.url || '').toLowerCase();
    return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(u);
  };

  const copyToClipboard = async (text: string) => {
    try { 
      await navigator.clipboard.writeText(text); 
      toast.showSuccess('Copied to clipboard!');
    } catch {}
  };

  const basename = (v: unknown) => {
    const s = String(v ?? '');
    if (!s) return s;
    if (s.includes('/') || s.includes('\\')) {
      const parts = s.split(/[/\\]/);
      return parts[parts.length - 1] || s;
    }
    return s;
  };

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

  const approve = async (id: string) => {
    if (!context) return;
    const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    if (res.ok) {
      await loadSignupRequests();
      setSelectedRequest(null);
      toast.showSuccess('Request approved successfully!');
    }
  };

  const reject = async (id: string) => {
    if (!context) return;
    const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (res.ok) {
      await loadSignupRequests();
      setSelectedRequest(null);
      toast.showSuccess('Request rejected.');
    }
  };

  const requestInfo = async (id: string) => {
    if (!context) return;
    const details = prompt('What information do you need from the user?');
    if (details == null) return;
    await fetch(`/api/signup-requests/info-request?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ required_information: details }),
    });
    toast.showInfo('Info request email sent (if email configured).');
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
    try {
      const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSelectedRequest(null);
        await loadSignupRequests();
        toast.showSuccess('Request deleted successfully.');
      } else {
        const errorText = await res.text();
        toast.showError('Failed to delete request: ' + errorText);
      }
    } catch (error: unknown) {
      toast.showError('Failed to delete request: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Recent Signup Requests</h2>
                <p className="text-[13px] text-slate-500 tracking-tight">Latest submissions requiring your attention</p>
              </div>
            </div>
                <Link 
                  href={`/requests?context=${context}`}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-medium text-[13px] tracking-tight transition-all duration-300 hover:shadow-md hover:shadow-blue-500/20"
                >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 opacity-60" />
                    Applicant
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 opacity-60" />
                    Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    Date
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <LoadingSpinner size="md" text="Loading requests..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <X className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">Error loading data</p>
                      <p className="text-sm text-gray-500 mb-4">{error}</p>
                        <button
                          onClick={() => {
                            setError(null);
                            loadStats();
                            loadSignupRequests();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                        >
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : allRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">No requests yet</p>
                      <p className="text-sm text-gray-500 mb-4">When users submit your signup form, they&apos;ll appear here.</p>
                      <Link
                        href={`/builder?context=${context}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                      >
                        Create your first form
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                allRequests.slice(0, 5).map((request, index) => {
                  const name = extractName(request.data);
                  const email = request.email || extractEmail(request.data) || '—';
                  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                  const avatarGradient = getAvatarGradient(name, request.id);
                  
                  return (
                    <tr 
                      key={request.id} 
                      className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-medium text-[13px] shadow-md ring-2 ring-white tracking-wide`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-slate-600 tracking-tight">{name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[14px] text-slate-600 tracking-tight">{email}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[14px] text-slate-600 tracking-tight">
                          {formatRelativeTime(request.submittedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide ${
                          request.status === 'pending' 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200/50' 
                            : request.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' 
                            : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                        }`}>
                          {request.status === 'pending' && <Clock className="w-3 h-3" />}
                          {request.status === 'approved' && <Check className="w-3 h-3" />}
                          {request.status === 'rejected' && <X className="w-3 h-3" />}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium tracking-tight hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal - Redesigned */}
      {selectedRequest && (() => {
        const requestName = extractName(selectedRequest.data);
        const requestEmail = selectedRequest.email || extractEmail(selectedRequest.data) || '—';
        const requestInitials = requestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
        const avatarGradient = getAvatarGradient(requestName, selectedRequest.id);
        const isPending = selectedRequest.status === 'pending';
        const isApproved = selectedRequest.status === 'approved';
        const isRejected = selectedRequest.status === 'rejected';
        
        const statusTheme = {
          pending: {
            headerBg: 'from-amber-50 via-orange-50 to-amber-100',
            accentColor: 'text-amber-700',
            accentBg: 'bg-amber-600',
            badgeBg: 'bg-amber-100 border-amber-200',
            badgeText: 'text-amber-700',
            icon: Clock,
            iconColor: 'text-amber-600',
          },
          approved: {
            headerBg: 'from-emerald-50 via-teal-50 to-emerald-100',
            accentColor: 'text-emerald-700',
            accentBg: 'bg-emerald-600',
            badgeBg: 'bg-emerald-100 border-emerald-200',
            badgeText: 'text-emerald-700',
            icon: CheckCircle2,
            iconColor: 'text-emerald-600',
          },
          rejected: {
            headerBg: 'from-rose-50 via-pink-50 to-rose-100',
            accentColor: 'text-rose-700',
            accentBg: 'bg-rose-600',
            badgeBg: 'bg-rose-100 border-rose-200',
            badgeText: 'text-rose-700',
            icon: XCircle,
            iconColor: 'text-rose-600',
          },
        };
        
        const theme = statusTheme[selectedRequest.status] || statusTheme.pending;
        const StatusIcon = theme.icon;
        
        return (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRequest(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`relative bg-gradient-to-br ${theme.headerBg} px-6 py-5 border-b border-slate-200`}>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-4 pr-10">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {requestInitials}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg ${theme.accentBg} flex items-center justify-center border-2 border-white shadow-md`}>
                      <StatusIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-bold ${theme.accentColor} mb-1 truncate`}>{requestName || 'Unknown Applicant'}</h3>
                    <p className="text-slate-600 text-sm flex items-center gap-1.5 mb-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{requestEmail}</span>
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(selectedRequest.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-50/30">
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={detailsSearch}
                        onChange={(e) => setDetailsSearch(e.target.value)}
                        placeholder="Search fields..."
                        className="w-full pl-9 pr-3 py-2 bg-white/60 border border-slate-200/60 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                      />
                    </div>
                    <button
                      onClick={() => setDetailsExpanded((s) => !s)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/60 border border-slate-200/60 text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 transition-all duration-200 cursor-pointer"
                    >
                      {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span className="hidden sm:inline">{detailsExpanded ? 'Less' : 'More'}</span>
                    </button>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-2 rounded-lg font-medium">
                      {Object.keys(selectedRequest.data || {}).length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {Object.entries(selectedRequest.data || {})
                      .filter(([k, v]) => {
                        if (!detailsSearch.trim()) return true;
                        const s = detailsSearch.toLowerCase();
                        return (k.toLowerCase().includes(s) || String(v ?? '').toLowerCase().includes(s));
                      })
                      .slice(0, detailsExpanded ? undefined : 6)
                      .map(([k, v], idx) => (
                        <div 
                          key={k} 
                          className="group bg-white/80 hover:bg-white rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 leading-none">
                                {k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="text-sm text-slate-900 break-words font-medium leading-relaxed">{basename(v) || '—'}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(String(v ?? '')); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                              title="Copy"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {!detailsExpanded && Object.keys(selectedRequest.data || {}).length > 6 && (
                    <button
                      onClick={() => setDetailsExpanded(true)}
                      className="w-full py-2.5 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border border-blue-200/60 hover:border-blue-300 cursor-pointer shadow-sm"
                    >
                      Show all {Object.keys(selectedRequest.data || {}).length} fields
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}

                  {selectedRequest.files?.length ? (
                    <div className="mt-5 pt-5 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-700 text-sm">Attachments</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">{selectedRequest.files.length}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedRequest.files.map((f, idx) => (
                          <a 
                            key={idx} 
                            href={f.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="group flex items-center gap-3 p-4 rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 cursor-pointer"
                          >
                            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
                              {isImage(f) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt={f.name} src={f.url} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors leading-tight mb-1">{f.name}</div>
                              <div className="text-xs text-slate-400">{f.size ? `${Math.round((f.size / 1024) * 10) / 10} KB` : 'File'}</div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="px-6 py-5 border-t border-slate-200 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex items-center gap-3">
                  {isPending && (
                    <>
                      <button
                        onClick={() => approve(selectedRequest.id)}
                        className="flex-1 bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-600 active:to-emerald-700 text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => reject(selectedRequest.id)}
                        className="flex-1 bg-gradient-to-br from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 active:from-rose-600 active:to-rose-700 text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => requestInfo(selectedRequest.id)}
                        className="flex-1 bg-gradient-to-br from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 active:from-blue-600 active:to-blue-700 text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline">Request Info</span>
                        <span className="sm:hidden">Info</span>
                      </button>
                      <button
                        onClick={() => remove(selectedRequest.id)}
                        className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {isApproved && (
                    <>
                      <div className="flex-1 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200/70 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700 font-semibold text-[15px]">Request Approved</span>
                      </div>
                      <button
                        onClick={() => reject(selectedRequest.id)}
                        className="px-6 py-3.5 bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-semibold text-[15px] transition-all duration-200 shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Revoke</span>
                      </button>
                      <button
                        onClick={() => remove(selectedRequest.id)}
                        className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {isRejected && (
                    <>
                      <div className="flex-1 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl border border-rose-200/70 shadow-sm">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-rose-700 font-semibold text-[15px]">Request Rejected</span>
                      </div>
                      <button
                        onClick={() => approve(selectedRequest.id)}
                        className="px-6 py-3.5 bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-600 active:to-emerald-700 text-white rounded-xl font-semibold text-[15px] transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => remove(selectedRequest.id)}
                        className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
