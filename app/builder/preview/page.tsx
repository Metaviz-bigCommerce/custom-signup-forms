'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minimize2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { FormField } from '@/components/FormBuilder/types';
import { normalizeThemeLayout } from '@/components/FormBuilder/utils';

/**
 * Get maximum character length for a field based on its type and role.
 * This ensures consistent validation across Form Builder, Live Preview, and embedded forms.
 */
function getMaxLength(field: any): number | undefined {
  // Email fields: reasonable limit for email addresses
  if (field.type === 'email' || field.role === 'email') {
    return 50;
  }
  
  // Phone/Number fields: reasonable limit for phone numbers
  if (field.type === 'phone' || field.type === 'number') {
    return 20;
  }
  
  // Name fields: reasonable limit for first/last names
  if (field.role === 'first_name' || field.role === 'last_name') {
    return 30;
  }
  
  // Textarea: more lenient for longer text
  if (field.type === 'textarea') {
    return 1000;
  }
  
  // URL fields: reasonable limit for URLs
  if (field.type === 'url') {
    return 2048;
  }
  
  // Generic text fields: reasonable default
  if (field.type === 'text') {
    return 100;
  }
  
  // Password, date, file, select, radio, checkbox don't need maxlength
  return undefined;
}

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context') || '';
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [theme, setTheme] = useState<any>({});
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [sourceTab, setSourceTab] = useState<number>(2); // Default to builder tab (2)
  const [countryData, setCountryData] = useState<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }>;}>>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasActiveForm, setHasActiveForm] = useState(false);
  const [fromDashboard, setFromDashboard] = useState(false); // Track if we came from dashboard

  useEffect(() => {
    const loadActiveForm = async () => {
      if (!context) {
        setLoading(false);
        return;
      }

      try {
        // Check if there's a flag indicating we should use sessionStorage (from builder)
        // If sessionStorage exists and was recently set (within last few seconds), use it
        // Otherwise, clear it and load from API (coming from dashboard)
        const storedData = sessionStorage.getItem('previewFormData');
        const shouldUseSessionStorage = storedData && (() => {
          try {
            const data = JSON.parse(storedData);
            // Check if there's a timestamp indicating recent navigation from builder
            // If timestamp exists and is recent (within 5 seconds), use sessionStorage
            if (data.timestamp) {
              const timeDiff = Date.now() - data.timestamp;
              return timeDiff < 5000; // 5 seconds
            }
            // If no timestamp, assume it's old and should be cleared
            return false;
          } catch {
            return false;
          }
        })();

        if (shouldUseSessionStorage) {
          // Coming from builder - use sessionStorage data
          try {
            const data = JSON.parse(storedData);
            setFormFields(data.formFields || []);
            setTheme(data.theme || {});
            setViewMode(data.viewMode || 'desktop');
            setSourceTab(data.sourceTab || 2);
            setHasActiveForm(true);
            setFromDashboard(false); // Coming from builder, show "Exit Fullscreen"
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse sessionStorage data:', e);
            // Clear invalid sessionStorage and continue to API
            sessionStorage.removeItem('previewFormData');
          }
        } else {
          // Coming from dashboard - clear old sessionStorage and load from API
          if (storedData) {
            sessionStorage.removeItem('previewFormData');
          }
        }

        // Load active form from API (coming from dashboard)
        const res = await fetch(`/api/store-form?context=${encodeURIComponent(context)}`);
        if (!res.ok) {
          throw new Error('Failed to load form');
        }
        const json = await res.json();
        
        // Handle standardized API response format
        const formData = json.error === false && json.data ? json.data : json;
        
        // Ensure formData has the expected structure
        if (formData && formData.active && formData.form) {
          // Use the active form from API (coming from dashboard)
          const form = formData.form;
          const fields = Array.isArray(form.fields) ? form.fields : [];
          const themeData = form.theme && typeof form.theme === 'object' ? form.theme : {};
          
          // Only proceed if we have fields (empty form is still valid, but we need at least the structure)
          setFormFields(fields);
          
          // Clean the theme object - ensure formBackgroundColor is only present if explicitly set and not default
          const cleanedTheme = { ...themeData };
          // If formBackgroundColor is white or matches default, remove it to ensure clean state
          if (cleanedTheme.formBackgroundColor === '#ffffff' || cleanedTheme.formBackgroundColor === '#fff' || cleanedTheme.formBackgroundColor === 'white') {
            delete cleanedTheme.formBackgroundColor;
          }
          setTheme(cleanedTheme);
          setViewMode('desktop');
          setHasActiveForm(true);
          setFromDashboard(true); // Coming from dashboard, show "Go Back"
        } else {
          // No active form or invalid structure
          setHasActiveForm(false);
        }
      } catch (error) {
        console.error('Failed to load preview data:', error);
        setHasActiveForm(false);
      } finally {
        setLoading(false);
      }
    };

    loadActiveForm();
  }, [context]);

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
        if (!cancelled) {
          setCountryData([
            { countryName: 'United States', countryShortCode: 'US', regions: [{ name: 'California', shortCode: 'CA' }, { name: 'New York', shortCode: 'NY' }] },
            { countryName: 'Canada', countryShortCode: 'CA', regions: [{ name: 'Ontario', shortCode: 'ON' }, { name: 'Quebec', shortCode: 'QC' }] },
            { countryName: 'United Kingdom', countryShortCode: 'GB', regions: [{ name: 'England' }, { name: 'Scotland' }, { name: 'Wales' }, { name: 'Northern Ireland' }] },
            { countryName: 'Australia', countryShortCode: 'AU', regions: [{ name: 'New South Wales', shortCode: 'NSW' }, { name: 'Victoria', shortCode: 'VIC' }] },
            { countryName: 'India', countryShortCode: 'IN', regions: [{ name: 'Maharashtra' }, { name: 'Karnataka' }] },
            { countryName: 'Pakistan', countryShortCode: 'PK', regions: [{ name: 'Punjab' }, { name: 'Sindh' }] },
          ]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Normalize theme and ensure formBackgroundColor is properly handled
  const normalizedTheme = normalizeThemeLayout(theme);
  // Double-check: if formBackgroundColor is white or default, explicitly remove it
  if (normalizedTheme.formBackgroundColor === '#ffffff' || normalizedTheme.formBackgroundColor === '#fff' || normalizedTheme.formBackgroundColor === 'white') {
    delete normalizedTheme.formBackgroundColor;
  }
  
  const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
  const isSplitLayout = normalizedTheme.layout === 'split' && hasValidImageUrl;
  
  const pr = normalizedTheme.primaryColor || '#2563eb';
  const ttl = normalizedTheme.title || 'Create your account';
  const sub = normalizedTheme.subtitle || 'Please fill in the form to continue';
  const titleColor = normalizedTheme.titleColor || pr;
  const titleFontSize = normalizedTheme.titleFontSize ?? 22;
  const titleFontWeight = normalizedTheme.titleFontWeight || '800';
  // Subtitle color defaults to primary color (same as title) for consistency
  const subtitleColor = normalizedTheme.subtitleColor || pr;
  const subtitleFontSize = normalizedTheme.subtitleFontSize ?? 13;
  const subtitleFontWeight = normalizedTheme.subtitleFontWeight || '400';
  
  // Responsive font sizes for mobile
  const isMobile = viewMode === 'mobile';
  const responsiveTitleSize = isMobile ? Math.max(18, titleFontSize * 0.85) : titleFontSize;
  const responsiveSubtitleSize = isMobile ? Math.max(12, subtitleFontSize * 0.9) : subtitleFontSize;
  const btnbg = (normalizedTheme.buttonBg && normalizedTheme.primaryColor && normalizedTheme.buttonBg !== normalizedTheme.primaryColor)
    ? normalizedTheme.buttonBg 
    : pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  
  // CRITICAL: Only use formBackgroundColor if it exists as a property in the normalized theme object
  // If it doesn't exist (was removed because it's white/default), ALWAYS use white
  // This prevents using stale background colors from previous forms
  const formBg = normalizedTheme.hasOwnProperty('formBackgroundColor') && normalizedTheme.formBackgroundColor
    ? String(normalizedTheme.formBackgroundColor).trim()
    : '#ffffff';
  
  // Same for page background
  const pageBg = normalizedTheme.hasOwnProperty('pageBackgroundColor') && normalizedTheme.pageBackgroundColor
    ? String(normalizedTheme.pageBackgroundColor).trim()
    : '#f9fafb';

  const handleShrink = () => {
    // Store the current form state back to sessionStorage so it can be restored
    // This ensures all customizations are preserved when returning to builder
    try {
      // Get context from URL or from stored data
      const storedContext = context || (() => {
        try {
          const storedData = sessionStorage.getItem('previewFormData');
          if (storedData) {
            const data = JSON.parse(storedData);
            return data.context || '';
          }
        } catch {}
        return '';
      })();
      
      // Get additional state from sessionStorage if it exists
      let additionalState: any = {};
      try {
        const builderState = sessionStorage.getItem('formBuilderState');
        if (builderState) {
          additionalState = JSON.parse(builderState);
        }
      } catch {}
      
      sessionStorage.setItem('previewFormData', JSON.stringify({
        formFields,
        theme,
        viewMode,
        sourceTab,
        context: storedContext, // Preserve context
        returnFromPreview: true, // Flag to indicate we're returning from preview
        // Preserve state needed for top action bar
        lastSavedState: additionalState.lastSavedState || null,
        isEditing: additionalState.isEditing || false,
        currentFormName: additionalState.currentFormName || 'Unnamed',
        currentFormVersionId: additionalState.currentFormVersionId || null,
        hasInitializedForm: additionalState.hasInitializedForm || false
      }));
      
      // Always redirect to builder tab (tab 2) since preview is only accessible from builder
      const params = new URLSearchParams();
      if (storedContext) {
        params.set('context', storedContext);
      }
      params.set('tab', '2');
      router.push(`/builder?${params.toString()}`);
    } catch (error) {
      console.error('Failed to store return data:', error);
      // Fallback to builder if storage fails
      const fallbackContext = context || '';
      const params = new URLSearchParams();
      if (fallbackContext) {
        params.set('context', fallbackContext);
      }
      params.set('tab', '2');
      router.push(`/builder?${params.toString()}`);
    }
  };

  const renderField = (field: FormField) => {
    const borderColor = field.borderColor || '#e5e7eb';
    const borderWidth = field.borderWidth || '1';
    const borderRadius = field.borderRadius || '10';
    const bgColor = field.bgColor || '#fff';
    const padding = field.padding || '12';
    const fontSize = field.fontSize || '14';
    const textColor = field.textColor || '#0f172a';
    
    // Responsive sizing for mobile
    const isMobile = viewMode === 'mobile';
    const fontSizeNum = typeof fontSize === 'string' ? parseInt(fontSize) : fontSize;
    const paddingNum = typeof padding === 'string' ? parseInt(padding) : padding;
    const labelSizeNum = field.labelSize ? (typeof field.labelSize === 'string' ? parseInt(field.labelSize) : field.labelSize) : 14;
    const responsiveFontSize = isMobile ? Math.max(14, fontSizeNum * 0.95) : fontSizeNum;
    const responsiveLabelSize = isMobile && field.labelSize ? Math.max(13, labelSizeNum * 0.9) : (field.labelSize || 14);
    const responsivePadding = isMobile ? Math.max(10, paddingNum * 0.85) : paddingNum;
    
    // For checkbox, hide label if empty
    const showLabel = field.type !== 'checkbox' || field.label?.trim();
    // For checkbox without label, use first option label as heading
    const checkboxLabel = field.type === 'checkbox' && !field.label?.trim() && field.options && field.options.length > 0
      ? field.options[0].label
      : field.label;
    
    return (
      <div key={field.id} style={{ width: '100%', boxSizing: 'border-box' }}>
        {showLabel && (
          <label 
            style={{ 
              color: field.labelColor,
              fontSize: responsiveLabelSize + 'px',
              fontWeight: field.labelWeight,
              display: 'block',
              marginBottom: '6px',
              cursor: 'pointer',
              lineHeight: '1.4'
            }}
          >
            {checkboxLabel}{field.required ? <span style={{ color: 'red' }}> *</span> : ''}
          </label>
        )}
        
        {field.role === 'country' ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              style={{
                borderColor: borderColor,
                borderWidth: borderWidth + 'px',
                borderStyle: 'solid',
                borderRadius: borderRadius + 'px',
                backgroundColor: bgColor,
                padding: responsivePadding + 'px',
                paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px',
                fontSize: responsiveFontSize + 'px',
                color: textColor,
                width: '100%',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                boxSizing: 'border-box'
              }}
              aria-label={field.label}
            >
              <option value="">Select a country</option>
              {countryData.map(c => (
                <option key={c.countryShortCode} value={c.countryShortCode}>{c.countryName}</option>
              ))}
            </select>
            <svg
              style={{
                position: 'absolute',
                right: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 8 + 'px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                width: isMobile ? '14px' : '16px',
                height: isMobile ? '14px' : '16px'
              }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="#6b7280"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : field.role === 'state' ? (
          countryData.find(c => c.countryShortCode === selectedCountryCode)?.regions?.length ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                style={{
                  borderColor: borderColor,
                  borderWidth: borderWidth + 'px',
                  borderStyle: 'solid',
                  borderRadius: borderRadius + 'px',
                  backgroundColor: bgColor,
                  padding: responsivePadding + 'px',
                  paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px',
                  fontSize: responsiveFontSize + 'px',
                  color: textColor,
                  width: '100%',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  boxSizing: 'border-box'
                }}
                aria-label={field.label}
              >
                <option value="">Select a state/province</option>
                {countryData.find(c => c.countryShortCode === selectedCountryCode)!.regions.map((r, i) => (
                  <option key={(r.shortCode || r.name) + i} value={r.shortCode || r.name}>{r.name}</option>
                ))}
              </select>
              <svg
                style={{
                  position: 'absolute',
                  right: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 8 + 'px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  width: isMobile ? '14px' : '16px',
                  height: isMobile ? '14px' : '16px'
                }}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="#6b7280"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <input
              type="text"
              placeholder={selectedCountryCode ? 'Enter state/province' : 'Select a country first'}
              style={{
                borderColor: borderColor,
                borderWidth: borderWidth + 'px',
                borderStyle: 'solid',
                borderRadius: borderRadius + 'px',
                backgroundColor: bgColor,
                padding: responsivePadding + 'px',
                fontSize: responsiveFontSize + 'px',
                color: textColor,
                width: '100%',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              aria-label={field.label}
              disabled={!selectedCountryCode}
            />
          )
        ) : field.type === 'textarea' ? (
          <textarea
            placeholder={field.placeholder || ''}
            rows={3}
            maxLength={getMaxLength(field)}
            style={{
              borderColor: borderColor,
              borderWidth: borderWidth + 'px',
              borderStyle: 'solid',
              borderRadius: borderRadius + 'px',
              backgroundColor: bgColor,
              padding: responsivePadding + 'px',
              fontSize: responsiveFontSize + 'px',
              color: textColor,
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
            aria-label={field.label}
          />
        ) : field.type === 'select' ? (
          <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            <select
              style={{
                borderColor: borderColor,
                borderWidth: borderWidth + 'px',
                borderStyle: 'solid',
                borderRadius: borderRadius + 'px',
                backgroundColor: bgColor,
                padding: responsivePadding + 'px',
                paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px',
                fontSize: responsiveFontSize + 'px',
                color: textColor,
                width: '100%',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                boxSizing: 'border-box'
              }}
              aria-label={field.label}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {(field.options || []).map((opt, idx) => (
                <option key={idx} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg
              style={{
                position: 'absolute',
                right: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 8 + 'px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                width: isMobile ? '14px' : '16px',
                height: isMobile ? '14px' : '16px'
              }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="#6b7280"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : field.type === 'radio' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(field.options || []).map((opt, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  value={opt.value}
                  style={{
                    width: isMobile ? '16px' : '18px',
                    height: isMobile ? '16px' : '18px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  className="radio-custom"
                />
                <span style={{ fontSize: responsiveFontSize + 'px', color: textColor, lineHeight: '1.4' }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(field.options && field.options.length > 0) ? (
              (field.options || []).map((opt, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    value={opt.value}
                    style={{
                      width: isMobile ? '16px' : '18px',
                      height: isMobile ? '16px' : '18px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    className="checkbox-custom"
                  />
                  <span style={{ fontSize: responsiveFontSize + 'px', color: textColor, lineHeight: '1.4' }}>
                    {opt.label}
                  </span>
                </label>
              ))
            ) : (
              field.label?.trim() && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{
                      width: isMobile ? '16px' : '18px',
                      height: isMobile ? '16px' : '18px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    className="checkbox-custom"
                  />
                  <span style={{ fontSize: responsiveFontSize + 'px', color: textColor, lineHeight: '1.4' }}>
                    {field.label}
                  </span>
                </label>
              )
            )}
          </div>
        ) : field.type === 'file' ? (
          <input
            type="file"
            style={{
              borderColor: borderColor,
              borderWidth: borderWidth + 'px',
              borderStyle: 'solid',
              borderRadius: borderRadius + 'px',
              backgroundColor: bgColor,
              padding: responsivePadding + 'px',
              fontSize: responsiveFontSize + 'px',
              color: textColor,
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            aria-label={field.label}
          />
        ) : (
          <input
            type={field.role === 'password' ? 'password' : (field.type === 'phone' ? 'tel' : field.type)}
            placeholder={field.placeholder || ''}
            pattern={field.type === 'phone' ? '[0-9]*' : undefined}
            inputMode={field.type === 'phone' ? 'numeric' : undefined}
            maxLength={getMaxLength(field)}
            onKeyPress={field.type === 'phone' ? (e) => {
              if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
              }
            } : undefined}
            style={{
              borderColor: borderColor,
              borderWidth: borderWidth + 'px',
              borderStyle: 'solid',
              borderRadius: borderRadius + 'px',
              backgroundColor: bgColor,
              padding: responsivePadding + 'px',
              fontSize: responsiveFontSize + 'px',
              color: textColor,
              width: '100%',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            aria-label={field.label}
          />
        )}
        
        <div 
          className="cs-error"
          style={{
            color: '#ef4444',
            fontSize: '12px',
            marginTop: '6px',
            display: 'none'
          }}
        />
      </div>
    );
  };

  const groupedFields: Array<{ fields: FormField[]; rowGroup: number | null }> = [];
  const processedIds = new Set<number>();
  
  for (let i = 0; i < formFields.length; i++) {
    if (processedIds.has(formFields[i].id)) continue;
    
    const field = formFields[i];
    if (field.rowGroup != null) {
      const groupFields = formFields.filter(f => f.rowGroup === field.rowGroup);
      groupedFields.push({ fields: groupFields, rowGroup: field.rowGroup });
      groupFields.forEach(f => processedIds.add(f.id));
    } else {
      groupedFields.push({ fields: [field], rowGroup: null });
      processedIds.add(field.id);
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Show prompt if no active form
  if (!hasActiveForm || !formFields.length) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Form</h2>
            <p className="text-gray-600 mb-6">
              There is no active form to preview. Please activate a form in the Form Builder to see its live preview.
            </p>
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (context) {
                  params.set('context', context);
                }
                params.set('tab', '2');
                router.push(`/builder?${params.toString()}`);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Go to Form Builder
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        /* Custom radio button styling */
        .radio-custom {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          background-color: white;
          position: relative;
        }
        
        .radio-custom:checked {
          border-color: #000000;
          background-color: #000000;
        }
        
        .radio-custom:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: white;
        }
        
        /* Custom checkbox styling */
        .checkbox-custom {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          position: relative;
        }
        
        .checkbox-custom:checked {
          border-color: #000000;
          background-color: #000000;
        }
        
        .checkbox-custom:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
          line-height: 1;
        }
      `}</style>
      
      {/* Floating Back/Exit Button */}
      {fromDashboard ? (
        <button
          onClick={() => {
            const contextParam = context ? `?context=${context}` : '';
            router.push(`/dashboard${contextParam}`);
          }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700/50 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          title="Go back to dashboard"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
      ) : (
        <button
          onClick={handleShrink}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700/50 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          title="Exit fullscreen"
          aria-label="Exit fullscreen preview"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* Fullscreen Form Preview */}
      <div 
        className="h-screen w-screen overflow-auto"
        style={{ 
          margin: '0',
          padding: '0',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji',
          backgroundColor: pageBg
        }}
      >
        {viewMode === 'desktop' ? (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: isSplitLayout ? '1.1fr .9fr' : '1fr',
              alignItems: 'stretch',
              gap: '0',
              minHeight: '100vh'
            }}
          >
            {isSplitLayout && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {hasValidImageUrl && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0',
                        backgroundImage: `url(${normalizedTheme.splitImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0',
                        background: 'radial-gradient(1200px 600px at -10% -20%, rgba(37,99,235,.35) 0%, transparent 60%)'
                      }}
                    />
                  </>
                )}
              </div>
            )}
            
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '56px 8px',
                minHeight: '100vh'
              }}
            >
              <div 
                style={{
                  width: '100%',
                  maxWidth: '680px',
                  background: formBg,
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                  padding: '28px',
                  boxSizing: 'border-box'
                }}
              >
                <h1 
                  style={{
                    fontSize: responsiveTitleSize + 'px',
                    fontWeight: titleFontWeight,
                    color: titleColor,
                    margin: '0 0 6px 0',
                    lineHeight: '1.3'
                  }}
                >
                  {ttl}
                </h1>
                
                <p 
                  style={{
                    fontSize: responsiveSubtitleSize + 'px',
                    fontWeight: subtitleFontWeight,
                    color: subtitleColor,
                    margin: '0 0 18px 0',
                    lineHeight: '1.4'
                  }}
                >
                  {sub}
                </p>
                
                <form style={{ display: 'grid', gap: '14px' }}>
                  {groupedFields.map((group) => {
                    // In desktop view, always allow paired fields
                    const isPaired = group.rowGroup != null && group.fields.length === 2;
                    
                    if (isPaired) {
                      return (
                        <div 
                          key={`group-${group.rowGroup}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '14px'
                          }}
                        >
                          {group.fields.map(field => renderField(field))}
                        </div>
                      );
                    } else {
                      return (
                        <React.Fragment key={group.rowGroup || `single-${group.fields[0].id}`}>
                          {group.fields.map(field => renderField(field))}
                        </React.Fragment>
                      );
                    }
                  })}
                  
                  {formFields.length > 0 && (
                    <button
                      type="submit"
                      style={{
                        height: '46px',
                        border: '0',
                        borderRadius: btnr + 'px',
                        background: btnbg,
                        color: btnc,
                        fontWeight: '700',
                        letterSpacing: '.02em',
                        cursor: 'pointer',
                        marginTop: '8px',
                        transition: 'transform .12s ease, opacity .12s ease',
                        width: '100%'
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {btnt}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              alignItems: 'stretch',
              gap: '0',
              minHeight: '100vh'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '8px',
                minHeight: '100vh'
              }}
            >
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: formBg,
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                    padding: '16px',
                    marginTop: '8px',
                    boxSizing: 'border-box'
                  }}
                >
                <h1 
                  style={{
                    fontSize: responsiveTitleSize + 'px',
                    fontWeight: titleFontWeight,
                    color: titleColor,
                    margin: '0 0 6px 0',
                    lineHeight: '1.3'
                  }}
                >
                  {ttl}
                </h1>
                
                <p 
                  style={{
                    fontSize: responsiveSubtitleSize + 'px',
                    fontWeight: subtitleFontWeight,
                    color: subtitleColor,
                    margin: '0 0 18px 0',
                    lineHeight: '1.4'
                  }}
                >
                  {sub}
                </p>
                
                <form style={{ display: 'grid', gap: '14px' }}>
                  {groupedFields.map((group) => (
                    <React.Fragment key={group.rowGroup || `single-${group.fields[0].id}`}>
                      {group.fields.map(field => renderField(field))}
                    </React.Fragment>
                  ))}
                  
                  {formFields.length > 0 && (
                    <button
                      type="submit"
                      style={{
                        height: '46px',
                        border: '0',
                        borderRadius: btnr + 'px',
                        background: btnbg,
                        color: btnc,
                        fontWeight: '700',
                        letterSpacing: '.02em',
                        cursor: 'pointer',
                        marginTop: '8px',
                        transition: 'transform .12s ease, opacity .12s ease',
                        width: '100%'
                      }}
                      onMouseDown={(e) => {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {btnt}
                    </button>
                  )}
                  
                  {/* Login Prompt - Always visible for Create Account forms */}
                  {formFields.length > 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: '1.5'
                      }}
                    >
                      Already have an account?{' '}
                      <a
                        href="/login.php"
                        style={{
                          color: pr,
                          textDecoration: 'none',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        Log in
                      </a>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

