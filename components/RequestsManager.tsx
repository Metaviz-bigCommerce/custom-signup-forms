'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Check, X, Mail } from 'lucide-react';
import { useSession } from '@/context/session';

type RequestItem = {
  id: string;
  submittedAt?: { seconds?: number; nanoseconds?: number } | string;
  status: 'pending' | 'approved' | 'rejected';
  data: Record<string, any>;
  files?: Array<{ name: string; url: string; contentType?: string; size?: number }>;
};

const RequestsManager: React.FC = () => {
  const { context } = useSession();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('');
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsSearch, setDetailsSearch] = useState('');
  const pageSize = 10;

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
      setItems(replace ? json.items : [...items, ...json.items]);
      setNextCursor(json.nextCursor || null);
    } catch (e) {
      // noop simple UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load and when filter changes
    setItems([]);
    setNextCursor(null);
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, context]);

  const approve = async (id: string) => {
    if (!context) return;
    const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    if (res.ok) {
      setItems(items.map(it => it.id === id ? { ...it, status: 'approved' } : it));
      setSelected(null);
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
      setItems(items.map(it => it.id === id ? { ...it, status: 'rejected' } : it));
      setSelected(null);
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

  const formatDate = (ts?: any) => {
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
  const remove = async (id: string) => {
    if (!context) return;
    const ok = confirm('Delete this request? This action cannot be undone.');
    if (!ok) return;
    const res = await fetch(`/api/signup-requests?id=${encodeURIComponent(id)}&context=${encodeURIComponent(context)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelected(null);
      // Reload first page to reflect deletion quickly
      setItems([]);
      setNextCursor(null);
      await load(null, true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Signup Requests</h2>
        <div className="flex gap-3">
          <button onClick={() => setStatusFilter('')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${statusFilter===''?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
            All
          </button>
          <button onClick={() => setStatusFilter('pending')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${statusFilter==='pending'?'bg-amber-600 text-white border-amber-600':'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
            Pending
          </button>
          <button onClick={() => setStatusFilter('approved')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${statusFilter==='approved'?'bg-emerald-600 text-white border-emerald-600':'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
            Approved
          </button>
          <button onClick={() => setStatusFilter('rejected')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${statusFilter==='rejected'?'bg-rose-600 text-white border-rose-600':'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}>
            Rejected
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Summary</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
        </table>
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {items.map(request => {
                const firstKey = Object.keys(request.data || {})[0];
                const summary = firstKey ? `${firstKey}: ${String(request.data[firstKey])}` : 'Submission';
                return (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{summary}</td>
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
                        onClick={() => setSelected(request)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!items.length && !loading && (
                <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={4}>No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">{items.length} loaded</div>
          <button
            onClick={() => load(nextCursor || undefined)}
            disabled={loading || !nextCursor}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${nextCursor ? 'bg-gray-800 text-white hover:bg-gray-900' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {loading ? 'Loading…' : (nextCursor ? 'Load More' : 'No More')}
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Request Details</h3>
                  <p className="text-xs text-gray-500">ID: <span className="font-mono">{selected.id}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selected.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    selected.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-700 rounded-lg px-2 py-1">✕</button>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Submitted</div>
                  <div className="text-sm font-medium text-gray-800">{formatDate(selected.submittedAt)}</div>
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
                    {Object.entries(selected.data || {})
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
                  {!detailsExpanded && Object.keys(selected.data || {}).length > 12 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setDetailsExpanded(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Show all {Object.keys(selected.data || {}).length} fields
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {selected.files?.length ? (
                <div className="mt-5 rounded-xl border border-gray-100">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <div className="text-sm font-semibold text-gray-700">Files ({selected.files.length})</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selected.files.map((f, idx) => (
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
                  onClick={() => approve(selected.id)}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  <span className="inline-flex items-center gap-2"><Check className="w-5 h-5" /> Approve</span>
                </button>
                <button
                  onClick={() => reject(selected.id)}
                  className="flex-1 bg-rose-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-rose-700 transition-colors"
                >
                  <span className="inline-flex items-center gap-2"><X className="w-5 h-5" /> Reject</span>
                </button>
                <button
                  onClick={() => requestInfo(selected.id)}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <span className="inline-flex items-center gap-2"><Mail className="w-5 h-5" /> Request Info</span>
                </button>
                <button
                  onClick={() => remove(selected.id)}
                  className="px-6 py-3 text-rose-600 bg-white border border-rose-300 rounded-lg font-medium hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelected(null)}
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

export default RequestsManager;

