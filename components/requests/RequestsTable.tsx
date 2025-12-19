'use client';

import React from 'react';
import { Users, Mail, Calendar, Clock, Check, X, Eye, FileText, Activity } from 'lucide-react';

export interface RequestTableItem {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
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
}

// Utility functions
const extractName = (data: Record<string, unknown>): string => {
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

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
    <p className="text-sm text-slate-500">Loading requests...</p>
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
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Optional Header */}
      {showHeader && (
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">{headerTitle}</h2>
                <p className="text-[13px] text-slate-500 tracking-tight">{headerSubtitle}</p>
              </div>
            </div>
            {headerAction}
          </div>
        </div>
      )}

      {/* Table */}
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
              <th className="px-6 py-4 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <LoadingSpinner />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-900 mb-1">{emptyMessage}</p>
                    <p className="text-sm text-slate-500">{emptySubMessage}</p>
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
                    className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                    onClick={() => onViewRequest(request)}
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
                      <span className="text-[14px] text-slate-600 tracking-tight">{email || '—'}</span>
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
                        onClick={(e) => { e.stopPropagation(); onViewRequest(request); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[13px] font-medium tracking-tight hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 cursor-pointer"
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

      {/* Optional Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default RequestsTable;
