'use client';

import React, { useState, useEffect } from 'react';
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
import { useStoreForm } from '@/lib/hooks';
import { FormField } from '@/components/FormBuilder/types';

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

// Helper function to find option label by value
const findOptionLabel = (formFields: FormField[], fieldKey: string, value: unknown, countryData?: any[], requestData?: Record<string, unknown>): string | null => {
  if (!formFields || !Array.isArray(formFields)) return null;
  
  // Try to find a field that matches the key (by label or by a normalized key)
  const normalizedKey = String(fieldKey).toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const field of formFields) {
    const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Check if this field matches the key
    if (
      field.label.toLowerCase() === fieldKey.toLowerCase() ||
      normalizedLabel === normalizedKey ||
      fieldKey.toLowerCase().includes(normalizedLabel) ||
      normalizedLabel.includes(normalizedKey)
    ) {
      // Handle country/state fields with codes
      if (field.role === 'country' && typeof value === 'string' && countryData && countryData.length > 0) {
        const country = countryData.find(c => c.countryShortCode === value);
        if (country) return country.countryName;
      } else if (field.role === 'state' && typeof value === 'string' && countryData && countryData.length > 0 && requestData) {
        // Find the country code from request data
        const countryField = formFields.find(f => f.role === 'country');
        if (countryField) {
          const countryKey = Object.keys(requestData).find(k => {
            const normalizedK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedCountryLabel = countryField.label.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalizedK === normalizedCountryLabel || k.toLowerCase().includes('country');
          });
          if (countryKey && requestData[countryKey]) {
            const countryCode = String(requestData[countryKey]);
            const country = countryData.find(c => c.countryShortCode === countryCode);
            if (country && country.regions) {
              const region = country.regions.find((r: { name: string; shortCode?: string }) => (r.shortCode || r.name) === value);
              if (region) return region.name;
            }
          }
        }
        // Fallback: try to find state in any country
        for (const country of countryData) {
          if (country.regions) {
            const region = country.regions.find((r: { name: string; shortCode?: string }) => (r.shortCode || r.name) === value);
            if (region) return region.name;
          }
        }
      }
      
      // Check if this is a select, radio, or checkbox field with options
      if ((field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && field.options) {
        const valueStr = String(value || '').toLowerCase();
        // Try exact match first
        const exactMatch = field.options.find(opt => opt.value.toLowerCase() === valueStr);
        if (exactMatch) return exactMatch.label;
        
        // Try case-insensitive match
        const caseInsensitiveMatch = field.options.find(opt => 
          opt.value.toLowerCase() === valueStr || 
          opt.label.toLowerCase() === valueStr
        );
        if (caseInsensitiveMatch) return caseInsensitiveMatch.label;
        
        // For checkbox, value might be "true", "false", "on", "off", "yes", "no", "1", "0"
        if (field.type === 'checkbox') {
          const boolValue = valueStr === 'true' || valueStr === 'on' || valueStr === 'yes' || valueStr === '1';
          if (boolValue && field.options.length > 0) {
            // If it's a single checkbox (no options), return the field label
            if (field.options.length === 0) return field.label;
            // Otherwise, try to find the matching option
            const checkedOption = field.options.find(opt => opt.value.toLowerCase() === valueStr);
            if (checkedOption) return checkedOption.label;
          }
        }
      }
    }
  }
  
  return null;
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
  const [countryData, setCountryData] = useState<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }> }>>([]);
  const { form } = useStoreForm();
  
  // Load country data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/country-region-data@3.0.0/data.json');
        const json = await res.json();
        if (!cancelled && Array.isArray(json)) {
          setCountryData(json);
        }
      } catch {
        // Ignore errors
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  
  // Get form fields from the form definition
  const formFields: FormField[] = (form?.fields as FormField[]) || [];
  
  // Helper to normalize strings for comparison
  const normalizeKey = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Helper to match request data key to form field label
  const matchKeyToField = (key: string): FormField | null => {
    const normalizedKey = normalizeKey(key);
    for (const field of formFields) {
      const normalizedLabel = normalizeKey(field.label);
      if (
        field.label.toLowerCase() === key.toLowerCase() ||
        normalizedLabel === normalizedKey ||
        key.toLowerCase().includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedKey)
      ) {
        return field;
      }
      // Also check by role
      if (field.role === 'first_name' && /first[\s_-]?name/i.test(key)) return field;
      if (field.role === 'last_name' && /last[\s_-]?name/i.test(key)) return field;
      if (field.role === 'email' && /email/i.test(key)) return field;
      if (field.role === 'country' && /country/i.test(key)) return field;
      if (field.role === 'state' && /state|province/i.test(key)) return field;
    }
    return null;
  };
  
  // Sort fields according to form field order, with first name, last name, email first
  const getFieldSortOrder = (key: string): number => {
    // Priority order: first_name (0), last_name (1), email (2), then by form field order
    const lowerKey = key.toLowerCase();
    if (/first[\s_-]?name/i.test(lowerKey)) return 0;
    if (/last[\s_-]?name/i.test(lowerKey)) return 1;
    if (/^email$/i.test(lowerKey)) return 2;
    
    // Find the field in formFields array
    const field = matchKeyToField(key);
    if (field) {
      // Return index + 100 to place after priority fields
      const index = formFields.indexOf(field);
      return index >= 0 ? index + 100 : 999;
    }
    return 999;
  };
  
  // Extract first name, last name, email for reference
  const firstNameKey = Object.keys(request.data || {}).find(k => /first[\s_-]?name/i.test(k));
  const lastNameKey = Object.keys(request.data || {}).find(k => /last[\s_-]?name/i.test(k));
  const emailKey = Object.keys(request.data || {}).find(k => /email/i.test(k)) || 'email';
  const firstName = firstNameKey ? String(request.data[firstNameKey] || '') : '';
  const lastName = lastNameKey ? String(request.data[lastNameKey] || '') : '';
  const requestEmail = extractEmail(request.data, request.email) || '—';
  
  // Helper to format field value with label resolution
  const formatFieldValue = (key: string, value: unknown): string => {
    // Try to find option label (including country/state)
    const label = findOptionLabel(formFields, key, value, countryData, request.data);
    if (label !== null) {
      return label;
    }
    
    // Fallback to original value formatting
    return basename(value) || '—';
  };
  
  // Helper to get field display label (for checkbox fields without labels)
  const getFieldDisplayLabel = (key: string, value: unknown): string => {
    const normalizedKey = String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const field of formFields) {
      const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (
        field.label.toLowerCase() === key.toLowerCase() ||
        normalizedLabel === normalizedKey ||
        key.toLowerCase().includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedKey)
      ) {
        // For checkbox fields without label, use first selected option's label
        if (field.type === 'checkbox' && (!field.label || !field.label.trim()) && field.options && field.options.length > 0) {
          const valueStr = String(value || '').toLowerCase();
          const matchingOption = field.options.find(opt => opt.value.toLowerCase() === valueStr);
          if (matchingOption) return matchingOption.label;
          // If value matches first option, use it
          if (field.options[0] && (valueStr === 'true' || valueStr === 'on' || valueStr === 'yes' || valueStr === '1')) {
            return field.options[0].label;
          }
        }
        // Return field label if it exists
        if (field.label && field.label.trim()) {
          return field.label;
        }
      }
    }
    
    // Fallback to formatted key
    return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  };

  const requestName = extractName(request.data);
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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[98vh] sm:max-h-[95vh] md:max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${theme.headerBg} px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b border-slate-200`}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer z-10"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-start sm:items-center gap-3 sm:gap-4 pr-9 sm:pr-10">
            <div className="relative shrink-0">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg`}>
                {requestInitials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full ${theme.accentBg} flex items-center justify-center border-2 border-white shadow-md`}>
                <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={`text-base sm:text-lg md:text-xl font-bold ${theme.accentColor} mb-0.5 sm:mb-1 truncate`}>
                {requestName || 'Unknown Applicant'}
              </h3>
              <p className="text-slate-600 text-[11px] sm:text-xs md:text-sm flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 truncate">
                <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="truncate">{requestEmail}</span>
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold ${theme.badgeBg} ${theme.badgeText} border shrink-0`}>
                  <StatusIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                  <span className="whitespace-nowrap">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                </span>
                <span className="text-slate-500 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="whitespace-nowrap">{formatRelativeTime(request.submittedAt)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                <input
                  value={detailsSearch}
                  onChange={(e) => setDetailsSearch(e.target.value)}
                  placeholder="Search fields..."
                  className="w-full pl-7 sm:pl-8 md:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-white/60 border border-slate-200/60 rounded-lg text-xs sm:text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 cursor-text"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailsExpanded((s) => !s)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white/60 border border-slate-200/60 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 transition-all duration-200 cursor-pointer shrink-0"
                >
                  {detailsExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span className="hidden sm:inline">{detailsExpanded ? 'Less' : 'More'}</span>
                  <span className="sm:hidden">{detailsExpanded ? '-' : '+'}</span>
                </button>
                <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg font-medium shrink-0">
                  {Object.entries(request.data || {}).filter(([k]) => {
                    const lowerK = k.toLowerCase();
                    return !/password/i.test(lowerK);
                  }).length}
                </span>
              </div>
            </div>

            {/* Render fields in form order, with first name, last name, email first, and grouped fields side by side */}
            {(() => {
              // Get all data entries (excluding passwords)
              const allDataEntries = Object.entries(request.data || {}).filter(([k]) => {
                const lowerK = k.toLowerCase();
                return !/password/i.test(lowerK);
              });

              // Apply search filter
              const filteredEntries = allDataEntries.filter(([k, v]) => {
                if (!detailsSearch.trim()) return true;
                const s = detailsSearch.toLowerCase();
                return k.toLowerCase().includes(s) || String(v ?? '').toLowerCase().includes(s);
              });

              // Group fields by rowGroup, maintaining form field order
              const groupedEntries: Array<{ entries: Array<[string, unknown]>; rowGroup: number | null }> = [];
              const processedKeys = new Set<string>();
              const processedFieldIds = new Set<number>();
              
              // Sort form fields: first_name, last_name, email first, then by original order
              const sortedFields = [...formFields].sort((a, b) => {
                const aPriority = a.role === 'first_name' ? 0 : a.role === 'last_name' ? 1 : a.role === 'email' ? 2 : 100;
                const bPriority = b.role === 'first_name' ? 0 : b.role === 'last_name' ? 1 : b.role === 'email' ? 2 : 100;
                if (aPriority !== bPriority) return aPriority - bPriority;
                return formFields.indexOf(a) - formFields.indexOf(b);
              });

              // Process fields in sorted order
              for (const field of sortedFields) {
                if (processedFieldIds.has(field.id)) continue;
                
                // Find matching data entry by comparing field label to data keys
                const matchingEntry = filteredEntries.find(([key]) => {
                  if (processedKeys.has(key)) return false;
                  const matchedField = matchKeyToField(key);
                  return matchedField?.id === field.id;
                });
                
                if (!matchingEntry) continue;

                if (field.rowGroup != null) {
                  // Find all fields with the same rowGroup
                  const groupFields = formFields.filter(f => f.rowGroup === field.rowGroup && !processedFieldIds.has(f.id));
                  const groupEntries: Array<[string, unknown]> = [matchingEntry];
                  processedKeys.add(matchingEntry[0]);
                  processedFieldIds.add(field.id);
                  
                  for (const groupField of groupFields) {
                    if (groupField.id === field.id) continue;
                    
                    // Find matching entry for this group field
                    const groupEntry = filteredEntries.find(([key]) => {
                      if (processedKeys.has(key)) return false;
                      const matchedField = matchKeyToField(key);
                      return matchedField?.id === groupField.id;
                    });
                    
                    if (groupEntry) {
                      groupEntries.push(groupEntry);
                      processedKeys.add(groupEntry[0]);
                      processedFieldIds.add(groupField.id);
                    }
                  }

                  groupedEntries.push({ entries: groupEntries, rowGroup: field.rowGroup });
                } else {
                  groupedEntries.push({ entries: [matchingEntry], rowGroup: null });
                  processedKeys.add(matchingEntry[0]);
                  processedFieldIds.add(field.id);
                }
              }
              
              // Add any remaining unmatched entries at the end (sorted by key for consistency)
              const remainingEntries = filteredEntries
                .filter(([k]) => !processedKeys.has(k))
                .sort(([a], [b]) => getFieldSortOrder(a) - getFieldSortOrder(b));
              
              for (const entry of remainingEntries) {
                groupedEntries.push({ entries: [entry], rowGroup: null });
                processedKeys.add(entry[0]);
              }

              // Limit display based on expanded state
              const displayGroups = detailsExpanded ? groupedEntries : groupedEntries.slice(0, 6);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                    {displayGroups.map((group, groupIdx) => {
                      if (group.rowGroup != null && group.entries.length === 2) {
                        // Render two fields side by side (country/state)
                        return (
                          <div key={`group-${group.rowGroup}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 col-span-1 sm:col-span-2">
                            {group.entries.map(([k, v]) => (
                              <div
                                key={k}
                                className="group bg-white/80 hover:bg-white rounded-lg sm:rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 p-3 sm:p-4"
                              >
                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 sm:mb-2 leading-none">
                                      {getFieldDisplayLabel(k, v)}
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-900 break-words font-normal leading-relaxed">
                                      {formatFieldValue(k, v)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(String(v ?? ''));
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                                    title="Copy"
                                  >
                                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        // Render single field
                        return group.entries.map(([k, v]) => (
                          <div
                            key={k}
                            className="group bg-white/80 hover:bg-white rounded-lg sm:rounded-xl border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 p-3 sm:p-4"
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5 sm:mb-2 leading-none">
                                  {getFieldDisplayLabel(k, v)}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-900 break-words font-normal leading-relaxed">
                                  {formatFieldValue(k, v)}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(String(v ?? ''));
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 sm:p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                                title="Copy"
                              >
                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        ));
                      }
                    })}
                  </div>

                  {!detailsExpanded && filteredEntries.length > 6 && (
                    <button
                      onClick={() => setDetailsExpanded(true)}
                      className="w-full py-2 sm:py-2.5 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border border-blue-200/60 hover:border-blue-300 cursor-pointer shadow-sm"
                    >
                      Show all {filteredEntries.length} fields
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </>
              );
            })()}

            {request.files?.length ? (
              <div className="mt-3 sm:mt-4 md:mt-5 pt-3 sm:pt-4 md:pt-5 border-t border-slate-200">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3 md:mb-4">
                  <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 text-[11px] sm:text-xs md:text-sm">Attachments</span>
                  <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-bold shrink-0">
                    {request.files.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                  {request.files.map((f, idx) => (
                    <a
                      key={idx}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-2 sm:gap-2.5 md:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-white/80 hover:bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-200">
                        {isImage(f) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={f.name} src={f.url} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs md:text-sm font-normal text-slate-700 truncate group-hover:text-blue-600 transition-colors leading-tight mb-0.5 sm:mb-1">
                          {f.name}
                        </div>
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-slate-400">
                          {f.size ? `${Math.round((f.size / 1024) * 10) / 10} KB` : 'File'}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-t border-slate-200 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 md:gap-3">
            {isPending && (
              <>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-[15px] transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <LoadingSpinner />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-[15px] transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <LoadingSpinner />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                      <span>Reject</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onRequestInfo(request.id)}
                  disabled={actionLoading !== null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-[15px] transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  {actionLoading === 'info' ? (
                    <>
                      <LoadingSpinner />
                      <span className="hidden sm:inline">Sending...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 shrink-0" />
                      <span className="hidden sm:inline">Request Info</span>
                      <span className="sm:hidden">Info</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer shrink-0"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
                </button>
              </>
            )}

            {isApproved && (
              <>
                <div className="flex-1 flex items-center gap-1.5 sm:gap-2 md:gap-2.5 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-emerald-50 rounded-lg sm:rounded-xl border border-emerald-200 shadow-sm min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-semibold text-xs sm:text-sm md:text-[15px] truncate">Request Approved</span>
                </div>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer shrink-0"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
                </button>
              </>
            )}

            {isRejected && (
              <>
                <div className="flex-1 flex items-center gap-1.5 sm:gap-2 md:gap-2.5 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3.5 bg-rose-50 rounded-lg sm:rounded-xl border border-rose-200 shadow-sm min-w-0">
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-rose-600 shrink-0" />
                  <span className="text-rose-700 font-semibold text-xs sm:text-sm md:text-[15px] truncate">Request Rejected</span>
                </div>
                <button
                  onClick={() => onApprove(request.id)}
                  disabled={actionLoading !== null}
                  className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-[15px] transition-colors duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <LoadingSpinner />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDelete(request.id)}
                  disabled={actionLoading !== null}
                  className="px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3.5 bg-white hover:bg-red-50 border-2 border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center justify-center cursor-pointer shrink-0"
                  title="Delete request"
                >
                  {actionLoading === 'delete' ? <DeleteSpinner /> : <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
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
