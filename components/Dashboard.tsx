'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Check, X, Users, Clock, TrendingUp, ArrowRight, Eye, Mail, Settings, Trash2 } from 'lucide-react';
import { useSession } from '@/context/session';

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
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsSearch, setDetailsSearch] = useState('');

  const formatDate = (ts?: any): string => {
    if (!ts) return '';
    if (typeof ts === 'string') return new Date(ts).toLocaleString();
    if (typeof ts?.seconds === 'number') return new Date(ts.seconds * 1000).toLocaleString();
    return '';
  };

  const isImage = (f?: { url?: string; contentType?: string }) => {
    const t = (f?.contentType || '').toLowerCase();
    if (t.startsWith('image/')) return true;
    const u = (f?.url || '').toLowerCase();
    return /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(u);
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const basename = (v: unknown) => {
    const s = String(v ?? '');
    if (!s) return s;
    // If looks like URL or path, reduce to filename
    if (s.includes('/') || s.includes('\\')) {
      const parts = s.split(/[/\\]/);
      return parts[parts.length - 1] || s;
    }
    return s;
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
    return '—';
  };

  const extractEmail = (data: Record<string, any>): string => {
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

  const loadSignupRequests = async () => {
    if (!context) {
      setLoading(false);
      setError('No context available');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('pageSize', '100'); // Get enough to calculate stats
      params.set('context', context);
      const res = await fetch(`/api/signup-requests?` + params.toString());
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API error:', res.status, errorText);
        setError(`Failed to load: ${res.status} ${errorText}`);
        setAllRequests([]);
        return;
      }
      const json = await res.json();
      const items: SignupRequestItem[] = json.items || [];
      setAllRequests(items);
    } catch (e: any) {
      console.error('Failed to load signup requests:', e);
      setError(e?.message || 'Failed to load signup requests');
      // Set empty arrays on error to show empty state
      setAllRequests([]);
    } finally {
      setLoading(false);
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
    alert('Info request email sent (if email configured).');
  };

  const remove = async (id: string) => {
    if (!context) return;
    const ok = confirm('Delete this request? This action cannot be undone.');
    if (!ok) return;
    const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
    setSelectedRequest(null);
      await loadSignupRequests();
    }
  };

  useEffect(() => {
    loadSignupRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);


  const stats = {
    pending: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length,
    total: allRequests.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here is what is happening with your signups.</p>
        </div>
        <Link 
          href="/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Form
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600 font-medium">Total Signups</div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600 font-medium">Pending Review</div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.approved}</div>
          <div className="text-sm text-gray-600 font-medium">Approved</div>
        </div>

        <div className="bg-white p-6 rounded border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.rejected}</div>
          <div className="text-sm text-gray-600 font-medium">Rejected</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link 
            href="/builder"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-all text-left group"
          >
            <Settings className="w-8 h-8 text-blue-600 mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Form Builder</div>
            <div className="text-sm text-gray-600">Create and customize forms</div>
          </Link>

          <Link 
            href="/requests"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-all text-left group"
          >
            <Users className="w-8 h-8 text-blue-600 mb-3" />
            <div className="font-semibold text-gray-900 mb-1">View Requests</div>
            <div className="text-sm text-gray-600">Manage signup requests</div>
          </Link>

          <Link 
            href="/emails"
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-all text-left group"
          >
            <Mail className="w-8 h-8 text-blue-600 mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Email Templates</div>
            <div className="text-sm text-gray-600">Customize notifications</div>
          </Link>

          <div className="p-4 bg-gray-50 rounded border border-gray-200 text-left">
            <Eye className="w-8 h-8 text-blue-600 mb-3" />
            <div className="font-semibold text-gray-900 mb-1">Preview Form</div>
            <div className="text-sm text-gray-600">See how it looks</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Signup Requests</h2>
          <Link 
            href="/requests"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : allRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No requests found.
                  </td>
                </tr>
              ) : (
                allRequests.slice(0, 5).map(request => {
                  const name = extractName(request.data);
                  const email = request.email || extractEmail(request.data) || '—';
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(request.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedRequest(request)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                        >
                          View Details
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
              <div className="flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
                  <p className="text-xs text-gray-500">ID: <span className="font-mono">{selectedRequest.id}</span></p>
              </div>
                <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedRequest.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  selectedRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
                  <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700 rounded-lg px-2 py-1">✕</button>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Submitted</div>
                  <div className="text-sm font-medium text-gray-800">{formatDate(selectedRequest.submittedAt)}</div>
                </div>
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">Search fields</div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <input
                        value={detailsSearch}
                        onChange={(e) => setDetailsSearch(e.target.value)}
                        placeholder="Filter by field or value…"
                        className="w-[240px] px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <button
                        onClick={() => setDetailsExpanded((s) => !s)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                      >
                        {detailsExpanded ? 'Collapse' : 'Expand all'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100">
                <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <div className="text-sm font-semibold text-gray-700">Submitted Fields</div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedRequest.data || {})
                      .filter(([k, v]) => {
                        if (!detailsSearch.trim()) return true;
                        const s = detailsSearch.toLowerCase();
                        return (k.toLowerCase().includes(s) || String(v ?? '').toLowerCase().includes(s));
                      })
                      .slice(0, detailsExpanded ? undefined : 12)
                      .map(([k, v]) => (
                        <div key={k} className="group rounded-lg border border-gray-100 hover:border-blue-200 transition-colors p-3 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-[11px] uppercase tracking-wide text-gray-500">{k}</div>
                              <div className="text-sm text-gray-900 break-words whitespace-pre-wrap break-all">{basename(v) || '—'}</div>
                            </div>
                            <button
                              onClick={() => copyToClipboard(String(v ?? ''))}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600"
                              title="Copy value"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                  {!detailsExpanded && Object.keys(selectedRequest.data || {}).length > 12 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setDetailsExpanded(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Show all {Object.keys(selectedRequest.data || {}).length} fields
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.files?.length ? (
                <div className="mt-5 rounded-xl border border-gray-100">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <div className="text-sm font-semibold text-gray-700">Files ({selectedRequest.files.length})</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRequest.files.map((f, idx) => (
                      <a key={idx} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                        <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                          {isImage(f) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={f.name} src={f.url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-500 text-xs">FILE</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-blue-700 underline truncate">{f.name}</div>
                          <div className="text-xs text-gray-500">{f.size ? `${Math.round((f.size / 1024) * 10) / 10} KB` : ''}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => approve(selectedRequest.id)}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <span className="inline-flex items-center gap-2"><Check className="w-5 h-5" /> Approve</span>
                </button>
              <button
                  onClick={() => reject(selectedRequest.id)}
                  className="flex-1 bg-rose-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors"
              >
                  <span className="inline-flex items-center gap-2"><X className="w-5 h-5" /> Reject</span>
              </button>
              <button
                  onClick={() => requestInfo(selectedRequest.id)}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                  <span className="inline-flex items-center gap-2"><Mail className="w-5 h-5" /> Request Info</span>
              </button>
              <button
                  onClick={() => remove(selectedRequest.id)}
                  className="px-6 py-3 text-rose-600 bg-white border border-rose-300 rounded-lg font-medium hover:bg-rose-50 transition-colors"
              >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

