'use client';

import React from 'react';
import { Users, Mail, Calendar, Clock, Check, X, Eye, FileText, Activity, ChevronRight, RotateCcw } from 'lucide-react';

export interface RequestTableItem {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected' | 'resubmission_requested';
  data: Record<string, unknown>;
  email?: string | null;
}

export interface RequestsTableProps {
  requests: RequestTableItem[];
  loading?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  onViewRequest: (request: RequestTableItem) => void;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  skeletonRows?: number;
}

// Utility functions
const extractName = (data: Record<string, unknown>): string => {
  const entries = Object.entries(data || {});
  
  // Try full name first
  const fullNameCandidates = ['name', 'full_name', 'full name'];
  for (const key of fullNameCandidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found && found[1]) return String(found[1]).trim();
  }
  
  // Try to combine first and last name
  const firstKey = entries.find(([k]) => /first[\s_-]?name/i.test(k));
  const lastKey = entries.find(([k]) => /last[\s_-]?name/i.test(k));
  if (firstKey && lastKey) {
    const firstName = String(firstKey[1] ?? '').trim();
    const lastName = String(lastKey[1] ?? '').trim();
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
  }
  
  // Fallback to any field containing 'name'
  const fuzzy = entries.find(([k]) => /name/i.test(k));
  if (fuzzy && fuzzy[1]) return String(fuzzy[1]).trim();
  
  return '';
};

const extractEmail = (item: RequestTableItem): string => {
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

const SkeletonRow = () => (
  <tr className="border-b border-slate-100 last:border-b-0">
    <td className="px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-slate-200 animate-pulse shrink-0" />
        <div className="h-4 lg:h-5 w-28 lg:w-32 bg-slate-200 rounded animate-pulse" />
      </div>
    </td>
    <td className="px-4 lg:px-6 py-3 lg:py-4">
      <div className="h-3.5 lg:h-4 w-36 lg:w-40 bg-slate-200 rounded animate-pulse" />
    </td>
    <td className="px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center gap-1.5 lg:gap-2">
        <div className="w-3.5 h-3.5 lg:w-4 lg:h-4 bg-slate-200 rounded animate-pulse shrink-0" />
        <div className="h-3.5 lg:h-4 w-20 lg:w-24 bg-slate-200 rounded animate-pulse" />
      </div>
    </td>
    <td className="px-4 lg:px-6 py-3 lg:py-4">
      <div className="h-6 lg:h-7 w-18 lg:w-20 bg-slate-200 rounded-lg animate-pulse" />
    </td>
    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
      <div className="h-9 lg:h-10 w-20 lg:w-24 bg-slate-200 rounded-lg lg:rounded-xl animate-pulse ml-auto" />
    </td>
  </tr>
);

const SkeletonLoader = ({ count = 5 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonRow key={index} />
    ))}
  </>
);

const MobileSkeletonRow = () => (
  <div className="bg-white border border-slate-200/60 rounded-lg sm:rounded-xl p-3 sm:p-4">
    <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 animate-pulse shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-[14px] sm:h-4 w-28 sm:w-32 bg-slate-200 rounded animate-pulse mb-1 sm:mb-1.5" />
        <div className="h-3 w-36 sm:w-40 bg-slate-200 rounded animate-pulse mb-1.5 sm:mb-2" />
        <div className="h-[22px] sm:h-6 w-16 sm:w-20 bg-slate-200 rounded-md sm:rounded-lg animate-pulse" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100">
      <div className="h-3 w-20 sm:w-24 bg-slate-200 rounded animate-pulse" />
      <div className="h-7 sm:h-8 w-16 sm:w-20 bg-slate-200 rounded-md sm:rounded-lg animate-pulse" />
    </div>
  </div>
);

const MobileSkeletonLoader = ({ count = 5 }: { count?: number }) => (
  <div className="p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <MobileSkeletonRow key={index} />
    ))}
  </div>
);

const RequestsTable: React.FC<RequestsTableProps> = ({
  requests,
  loading = false,
  emptyMessage = 'No requests found',
  emptySubMessage = 'When users submit your signup form, they\'ll appear here.',
  onViewRequest,
  showHeader = false,
  headerTitle = 'Signup Requests',
  headerSubtitle = 'Manage and review all signup submissions',
  headerAction,
  footer,
  skeletonRows = 5,
}) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Optional Header */}
      {showHeader && (
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 lg:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] min-[390px]:text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight break-words leading-tight">{headerTitle}</h2>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 sm:line-clamp-none">{headerSubtitle}</p>
              </div>
            </div>
            {headerAction && (
              <div className="shrink-0 w-full sm:w-auto">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden">
        {loading ? (
          <MobileSkeletonLoader count={skeletonRows} />
        ) : requests.length === 0 ? (
          <div className="px-3 sm:px-4 py-16 sm:py-20 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-inner">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-bold text-slate-800 text-lg mb-1">{emptyMessage}</p>
              <p className="text-sm text-slate-500 max-w-sm">{emptySubMessage}</p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 sm:p-3 md:p-4 space-y-2.5 sm:space-y-3">
            {requests.map((request, index) => {
              const name = extractName(request.data);
              const email = extractEmail(request);
              const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
              const avatarGradient = getAvatarGradient(name, request.id);

              return (
                <div
                  key={request.id}
                  onClick={() => onViewRequest(request)}
                  className="group bg-white border border-slate-200/60 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-300 cursor-pointer"
                  style={{ 
                    animation: `fadeInUp 0.4s ease-out forwards`,
                    animationDelay: `${index * 50}ms`,
                    opacity: 0 
                  }}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                    <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-lg shrink-0`}>
                      {initials}
                      <div className="absolute inset-0 rounded-full ring-2 ring-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-600 transition-colors mb-1 truncate">
                        {name || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2">
                        <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span className="truncate">{email || '—'}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 ${
                        request.status === 'pending'
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-100'
                          : request.status === 'approved'
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100'
                          : request.status === 'rejected'
                          ? 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200/60 shadow-sm shadow-rose-100'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 shadow-sm shadow-blue-100'
                      }`}>
                        {request.status === 'pending' && <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {request.status === 'approved' && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {request.status === 'rejected' && <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {request.status === 'resubmission_requested' && <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {request.status === 'resubmission_requested' 
                          ? 'Resubmission Requested'
                          : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{formatRelativeTime(request.submittedAt)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewRequest(request); }}
                      className="group/btn inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-800 text-white rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium hover:bg-blue-600 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>View</span>
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-left">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Applicant
                </div>
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-left">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </div>
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-left">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date
                </div>
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-left">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </span>
              </th>
              <th className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonLoader count={skeletonRows} />
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 shadow-inner">
                      <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-800 text-lg mb-1">{emptyMessage}</p>
                    <p className="text-sm text-slate-500 max-w-sm">{emptySubMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              requests.map((request, index) => {
                const name = extractName(request.data);
                const email = extractEmail(request);
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
                const avatarGradient = getAvatarGradient(name, request.id);

                return (
                  <tr
                    key={request.id}
                    className="group border-b border-slate-100 last:border-b-0 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-300 cursor-pointer"
                    onClick={() => onViewRequest(request)}
                    style={{ 
                      animation: `fadeInUp 0.4s ease-out forwards`,
                      animationDelay: `${index * 50}ms`,
                      opacity: 0 
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                          {initials}
                          <div className="absolute inset-0 rounded-full ring-2 ring-white/50" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className="text-xs lg:text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                        {email || '—'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-400" />
                        <span className="text-xs lg:text-sm text-slate-600">
                          {formatRelativeTime(request.submittedAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                        request.status === 'pending'
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200/60 shadow-sm shadow-amber-100'
                          : request.status === 'approved'
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-sm shadow-emerald-100'
                          : request.status === 'rejected'
                          ? 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border border-rose-200/60 shadow-sm shadow-rose-100'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/60 shadow-sm shadow-blue-100'
                      }`}>
                        {request.status === 'pending' && <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                        {request.status === 'approved' && <Check className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                        {request.status === 'rejected' && <X className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                        {request.status === 'resubmission_requested' && <RotateCcw className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                        {request.status === 'resubmission_requested' 
                          ? 'Resubmission Requested'
                          : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewRequest(request); }}
                        className="group/btn inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-slate-800 text-white rounded-xl text-xs lg:text-sm font-medium hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          {footer}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RequestsTable;
