'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Search,
  XCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  ExternalLink,
  Trash2,
  MessageSquare,
  Check,
} from 'lucide-react';

export type RequestItem = {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, unknown>;
  email?: string | null;
  files?: Array<{ name: string; url: string; contentType?: string; size?: number }>;
};

export type ActionLoadingType = 'approve' | 'reject' | 'info' | 'delete' | null;

export interface RequestDetailsModalProps {
  request: RequestItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestInfo: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: ActionLoadingType;
  showToast?: (message: string) => void;
}

// Utility functions
const extractName = (data: Record<string, unknown>): string => {
  const firstKey = Object.keys(data || {}).find((k) =>
    /first[\s_-]?name/i.test(k)
  );
  const lastKey = Object.keys(data || {}).find((k) =>
    /last[\s_-]?name/i.test(k)
  );
  if (firstKey && lastKey) {
    return `${data[firstKey] || ''} ${data[lastKey] || ''}`.trim();
  }
  const nameKey = Object.keys(data || {}).find((k) => /^name$/i.test(k));
  if (nameKey) return String(data[nameKey] || '');
  const fullNameKey = Object.keys(data || {}).find((k) =>
    /full[\s_-]?name/i.test(k)
  );
  if (fullNameKey) return String(data[fullNameKey] || '');
  return '';
};

const extractEmail = (data: Record<string, unknown>, requestEmail?: string | null): string => {
  if (requestEmail) return requestEmail;
  const entries = Object.entries(data || {});
  const candidates = ['email', 'e-mail', 'email_address', 'email address'];
  for (const key of candidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found) return String(found[1] ?? '');
  }
  const fuzzy = entries.find(([k]) => /email/i.test(k));
  if (fuzzy) return String(fuzzy[1] ?? '');
  return '';
};

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

const getAvatarGradient = (name: string, id: string) => {
  const str = name || id;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
};

const isImage = (f?: { url?: string; contentType?: string }) => {
  if (!f) return false;
  if (f.contentType?.startsWith('image/')) return true;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(f.url || '')) return true;
  return false;
};

const basename = (v: unknown) => {
  if (typeof v !== 'string') return String(v ?? '');
  const parts = v.split('/');
  return parts[parts.length - 1] || v;
};

const formatDate = (ts?: { seconds?: number; nanoseconds?: number } | string) => {
  if (!ts) return '';
  if (typeof ts === 'string') return new Date(ts).toLocaleString();
  if (typeof ts === 'object' && ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  return '';
};

const formatRelativeTime = (ts?: { seconds?: number; nanoseconds?: number } | string) => {
  if (!ts) return '';
  let date: Date;
  if (typeof ts === 'string') {
    date = new Date(ts);
  } else if (typeof ts === 'object' && ts.seconds) {
    date = new Date(ts.seconds * 1000);
  } else {
    return '';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
};

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
  onDelete,
  actionLoading,
  showToast,
}) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsSearch, setDetailsSearch] = useState('');

  const requestName = extractName(request.data);
  const requestEmail = extractEmail(request.data, request.email) || '—';
  const requestInitials = requestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const avatarGradient = getAvatarGradient(requestName, request.id);
  const isPending = request.status === 'pending';
  const isApproved = request.status === 'approved';
  const isRejected = request.status === 'rejected';

  const statusTheme = {
    pending: {
      headerBg: 'from-amber-100 via-orange-100 to-yellow-100',
      accentColor: 'text-amber-800',
      accentBg: 'bg-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200',
      badgeText: 'text-amber-600',
      icon: AlertCircle,
    },
    approved: {
      headerBg: 'from-emerald-50 via-teal-50 to-emerald-100',
      accentColor: 'text-emerald-700',
      accentBg: 'bg-emerald-600',
      badgeBg: 'bg-emerald-100 border-emerald-200',
      badgeText: 'text-emerald-700',
      icon: Check,
    },
    rejected: {
      headerBg: 'from-rose-50 via-pink-50 to-rose-100',
      accentColor: 'text-rose-700',
      accentBg: 'bg-rose-600',
      badgeBg: 'bg-rose-100 border-rose-200',
      badgeText: 'text-rose-700',
      icon: X,
    },
  };

  const theme = statusTheme[request.status] || statusTheme.pending;
  const StatusIcon = theme.icon;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast?.('Copied to clipboard!');
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast?.('Copied to clipboard!');
    }
  };

  const LoadingSpinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  const DeleteSpinner = () => (
    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${theme.headerBg} px-6 py-5 border-b border-slate-200`}>
          <button
            onClick={onClose}
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
              <h3 className={`text-xl font-bold ${theme.accentColor} mb-1 truncate`}>
                {requestName || 'Unknown Applicant'}
              </h3>
              <p className="text-slate-600 text-sm flex items-center gap-1.5 mb-2 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{requestEmail}</span>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border`}>
                  <StatusIcon className="w-3 h-3" />
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
                <span className="text-slate-500 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(request.submittedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
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
                {Object.keys(request.data || {}).length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {Object.entries(request.data || {})
                .filter(([k, v]) => {
                  if (!detailsSearch.trim()) return true;
                  const s = detailsSearch.toLowerCase();
                  return k.toLowerCase().includes(s) || String(v ?? '').toLowerCase().includes(s);
                })
                .slice(0, detailsExpanded ? undefined : 6)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="group bg-white/80 hover:bg-white rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 leading-none">
                          {k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-sm text-slate-900 break-words font-normal leading-relaxed">
                          {basename(v) || '—'}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(String(v ?? ''));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {!detailsExpanded && Object.keys(request.data || {}).length > 6 && (
              <button
                onClick={() => setDetailsExpanded(true)}
                className="w-full py-2.5 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border border-blue-200/60 hover:border-blue-300 cursor-pointer shadow-sm"
              >
                Show all {Object.keys(request.data || {}).length} fields
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {request.files?.length ? (
              <div className="mt-5 pt-5 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-700 text-sm">Attachments</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold">
                    {request.files.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {request.files.map((f, idx) => (
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
                        <div className="text-sm font-normal text-slate-700 truncate group-hover:text-blue-600 transition-colors leading-tight mb-1">
                          {f.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {f.size ? `${Math.round((f.size / 1024) * 10) / 10} KB` : 'File'}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-200 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="flex items-center gap-3">
            {isPending && (
              <>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <LoadingSpinner />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <LoadingSpinner />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>Reject</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onRequestInfo(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-semibold text-[15px] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading === 'info' ? (
                    <>
                      <LoadingSpinner />
                      <span className="hidden sm:inline">Sending...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      <span className="hidden sm:inline">Request Info</span>
                      <span className="sm:hidden">Info</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}

            {isApproved && (
              <>
                <div className="flex-1 flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-semibold text-[15px]">Request Approved</span>
                </div>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}

            {isRejected && (
              <>
                <div className="flex-1 flex items-center gap-2.5 px-5 py-3.5 bg-rose-50 rounded-xl border border-rose-200 shadow-sm">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="text-rose-700 font-semibold text-[15px]">Request Rejected</span>
                </div>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={actionLoading !== null}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-[15px] transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <LoadingSpinner />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-4 py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
