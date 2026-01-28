'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Maximize2, Eye } from 'lucide-react';
import { FormField } from './types';
import { normalizeThemeLayout } from './utils';

interface LivePreviewProps {
  formFields: FormField[];
  theme: any;
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
}

/**
 * Get maximum character length for a field based on its type and role.
 * This ensures consistent validation across Form Builder, Live Preview, and embedded forms.
 */
function getMaxLength(field: FormField): number | undefined {
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

const LivePreview: React.FC<LivePreviewProps> = ({ formFields, theme, viewMode, onViewModeChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context') || '';
  
  // Country/State dynamic data for address fields
  const [countryData, setCountryData] = useState<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }>;}>>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  // File validation errors - keyed by field id
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  // File names for display - keyed by field id
  const [fileNames, setFileNames] = useState<Record<number, string>>({});

  const handleExpand = () => {
    // Store form data in sessionStorage for seamless navigation
    // Also store the source tab (builder tab = 1) and context so we can redirect back correctly
    // We need to get additional state from the parent component
    try {
      // Get additional state from sessionStorage if it was stored by FormBuilder
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
        sourceTab: 1, // Builder tab is always tab 1
        context: context, // Store context for redirect
        timestamp: Date.now(), // Add timestamp to identify recent navigation from builder
        // Store state needed for top action bar
        lastSavedState: additionalState.lastSavedState || null,
        isEditing: additionalState.isEditing || false,
        currentFormName: additionalState.currentFormName || 'Unnamed',
        currentFormVersionId: additionalState.currentFormVersionId || null,
        hasInitializedForm: additionalState.hasInitializedForm || false
      }));
      // Include context in the preview URL
      const contextParam = context ? `?context=${context}` : '';
      router.push(`/builder/preview${contextParam}`);
    } catch (error) {
      console.error('Failed to store preview data:', error);
    }
  };
  
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
          // Minimal fallback to keep preview functional offline
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

  // Normalize theme layout to match what will be generated
  const normalizedTheme = normalizeThemeLayout(theme);
  
  // Only use split layout if layout is 'split' AND there's a valid non-empty image URL
  const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
  const isSplitLayout = normalizedTheme.layout === 'split' && hasValidImageUrl;
  
  // Get theme values with defaults matching the script
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
  // Use primaryColor for button background unless buttonBg is explicitly set to a different value
  // This ensures primaryColor controls the button by default, making primary color changes reflect immediately
  const btnbg = (normalizedTheme.buttonBg && normalizedTheme.primaryColor && normalizedTheme.buttonBg !== normalizedTheme.primaryColor) 
    ? normalizedTheme.buttonBg 
    : pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  const formBg = normalizedTheme.formBackgroundColor || '#ffffff';
  const pageBg = normalizedTheme.pageBackgroundColor || '#f9fafb';
  
  // Form content component - matching exact script structure
  const FormContent = () => {
    // Responsive font sizes for mobile
    const isMobile = viewMode === 'mobile';
    const responsiveTitleSize = isMobile ? Math.max(18, titleFontSize * 0.85) : titleFontSize;
    const responsiveSubtitleSize = isMobile ? Math.max(12, subtitleFontSize * 0.9) : subtitleFontSize;
    
    return (
    <>
      {/* Title - responsive sizing */}
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
      
      {/* Subtitle - responsive sizing */}
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
      
      {/* Form - exact match from script */}
      <form style={{ display: 'grid', gap: '14px' }}>
        {(() => {
          // Group fields by rowGroup for 2-column layout
          const groupedFields: Array<{ fields: FormField[]; rowGroup: number | null }> = [];
          const processedIds = new Set<number>();
          
          for (let i = 0; i < formFields.length; i++) {
            if (processedIds.has(formFields[i].id)) continue;
            
            const field = formFields[i];
            if (field.rowGroup != null) {
              // Find all fields with the same rowGroup
              const groupFields = formFields.filter(f => f.rowGroup === field.rowGroup);
              groupedFields.push({ fields: groupFields, rowGroup: field.rowGroup });
              groupFields.forEach(f => processedIds.add(f.id));
            } else {
              // Single field, full width
              groupedFields.push({ fields: [field], rowGroup: null });
              processedIds.add(field.id);
            }
          }
          
          return groupedFields.map((group) => {
            const isMobile = viewMode === 'mobile';
            const isPaired = group.rowGroup != null && group.fields.length === 2 && !isMobile;
            
            if (isPaired) {
              // Render paired fields side-by-side
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
              // Render single field or mobile (stacked)
              return (
                <React.Fragment key={group.rowGroup || `single-${group.fields[0].id}`}>
                  {group.fields.map(field => renderField(field))}
                </React.Fragment>
              );
            }
          });
          
          function renderField(field: FormField) {
            // Default values matching script
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
            
            return (
              <div key={field.id} style={{ width: '100%', boxSizing: 'border-box' }}>
                {/* Label - responsive sizing */}
                {/* Hide label for checkbox if empty (option-only checkbox) */}
                {(field.type !== 'checkbox' || field.label?.trim()) && (
                  <label 
                    style={{ 
                      color: field.labelColor,
                      fontSize: responsiveLabelSize + 'px',
                      fontWeight: field.labelWeight,
                      display: 'block',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      lineHeight: '1.4',
                      wordWrap: 'break-word',
                      overflowWrap: 'anywhere',
                      maxWidth: '100%'
                    }}
                  >
                    {field.label}{field.required ? <span style={{ color: 'red' }}> *</span> : ''}
                  </label>
                )}
                
                {/* Input field - exact match from script */}
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
                        paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px', // Extra padding for dropdown arrow
                        fontSize: responsiveFontSize + 'px',
                        color: textColor,
                        width: '100%',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="appearance-none bg-no-repeat bg-right pr-8"
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
                        paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px', // Extra padding for dropdown arrow
                        fontSize: responsiveFontSize + 'px',
                        color: textColor,
                        width: '100%',
                        outline: 'none',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        boxSizing: 'border-box'
                      }}
                      className="appearance-none bg-no-repeat bg-right pr-8"
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
                        paddingRight: (typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding)) || 12) + 30 + 'px', // Extra padding for dropdown arrow
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
                        <span style={{ 
                          fontSize: responsiveFontSize + 'px', 
                          color: textColor, 
                          lineHeight: '1.4',
                          wordWrap: 'break-word',
                          overflowWrap: 'anywhere',
                          flex: '1',
                          minWidth: 0
                        }}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(field.options && field.options.length > 0) ? (
                      // Checkbox group
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
                          <span style={{ 
                            fontSize: responsiveFontSize + 'px', 
                            color: textColor, 
                            lineHeight: '1.4',
                            wordWrap: 'break-word',
                            overflowWrap: 'anywhere',
                            flex: '1',
                            minWidth: 0
                          }}>
                            {opt.label}
                          </span>
                        </label>
                      ))
                    ) : (
                      // Single checkbox (only shown if label exists, otherwise validation requires options)
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
                          <span style={{ 
                            fontSize: responsiveFontSize + 'px', 
                            color: textColor, 
                            lineHeight: '1.4',
                            wordWrap: 'break-word',
                            overflowWrap: 'anywhere',
                            flex: '1',
                            minWidth: 0
                          }}>
                            {field.label}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                ) : field.type === 'file' ? (
                  <>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input
                        type="file"
                        id={`file-input-${field.id}`}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) {
                            setFileErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[field.id];
                              return newErrors;
                            });
                            setFileNames(prev => {
                              const newNames = { ...prev };
                              delete newNames[field.id];
                              return newNames;
                            });
                          } else {
                            // Extract just the filename (remove path)
                            const fileName = file.name.split(/[/\\]/).pop() || file.name;
                            setFileNames(prev => ({ ...prev, [field.id]: fileName }));
                            
                            const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                            const ALLOWED_TYPES = [
                              'application/pdf',
                              'application/msword',
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'application/vnd.ms-excel',
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            ];
                            
                            let error = '';
                            
                            // Check file size
                            if (file.size > MAX_SIZE) {
                              error = `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
                            }
                            // Check file type
                            else if (!ALLOWED_TYPES.includes(file.type)) {
                              error = 'Only PDF, DOC, DOCX, XLS, and XLSX files are allowed';
                            }
                            
                            if (error) {
                              setFileErrors(prev => ({ ...prev, [field.id]: error }));
                              setFileNames(prev => {
                                const newNames = { ...prev };
                                delete newNames[field.id];
                                return newNames;
                              });
                              e.target.value = ''; // Clear the input
                            } else {
                              setFileErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors[field.id];
                                return newErrors;
                              });
                            }
                          }
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          zIndex: 2
                        }}
                        aria-label={field.label || 'File upload'}
                      />
                      <div
                        style={{
                          borderColor: fileErrors[field.id] ? '#ef4444' : borderColor,
                          borderWidth: borderWidth + 'px',
                          borderStyle: 'solid',
                          borderRadius: borderRadius + 'px',
                          backgroundColor: bgColor,
                          padding: responsivePadding + 'px',
                          fontSize: responsiveFontSize + 'px',
                          color: fileNames[field.id] ? textColor : '#9ca3af',
                          width: '100%',
                          minHeight: `${(typeof responsivePadding === 'number' ? responsivePadding : parseInt(String(responsivePadding))) * 2 + (typeof responsiveFontSize === 'number' ? responsiveFontSize : parseInt(String(responsiveFontSize))) + 4}px`,
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          pointerEvents: 'none'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          const input = document.getElementById(`file-input-${field.id}`) as HTMLInputElement;
                          input?.click();
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const input = document.getElementById(`file-input-${field.id}`) as HTMLInputElement;
                            input?.click();
                          }
                        }}
                        aria-label={`${field.label || 'File upload'} - Click to select file`}
                      >
                        <span style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          pointerEvents: 'none'
                        }}>
                          {fileNames[field.id] || 'Choose file...'}
                        </span>
                      </div>
                    </div>
                    {fileErrors[field.id] && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '6px'
                      }}>
                        {fileErrors[field.id]}
                      </div>
                    )}
                  </>
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
                
                {/* Error div (hidden by default, matching script) */}
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
          }
        })()}
        
        {/* Submit Button - responsive sizing */}
        {formFields.length > 0 && (
          <button
            type="submit"
            style={{
              height: isMobile ? '44px' : '46px',
              border: '0',
              borderRadius: btnr + 'px',
              background: btnbg,
              color: btnc,
              fontWeight: '700',
              letterSpacing: '.02em',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'transform .12s ease, opacity .12s ease',
              width: '100%',
              fontSize: isMobile ? '14px' : '16px',
              boxSizing: 'border-box'
            }}
            className="cursor-pointer"
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
              fontSize: isMobile ? '13px' : '14px',
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
    </>
  );
  };
  
  return (
    <>
      {/* CSS keyframes matching script */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
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
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden w-full">
        {/* Preview Header - Matching EmailTemplates style - Responsive */}
        <div className="px-2 sm:px-3 md:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-9 lg:h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0">
                <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800 text-[10px] sm:text-sm md:text-sm lg:text-base break-words">Live Preview</h3>
                <p className="text-[9px] sm:text-xs md:text-xs text-slate-500 break-words">Changes update in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {/* View Mode Toggle - Responsive */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 rounded-full p-0.5 sm:p-1">
                <button
                  onClick={() => onViewModeChange('desktop')}
                  className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 text-[9px] sm:text-xs md:text-xs font-medium rounded-full transition-colors cursor-pointer ${
                    viewMode === 'desktop'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span className="hidden sm:inline">Desktop</span>
                  <span className="sm:hidden">D</span>
                </button>
                <button
                  onClick={() => onViewModeChange('mobile')}
                  className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 text-[9px] sm:text-xs md:text-xs font-medium rounded-full transition-colors cursor-pointer ${
                    viewMode === 'mobile'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span className="hidden sm:inline">Mobile</span>
                  <span className="sm:hidden">M</span>
                </button>
              </div>
              {/* Expand to Fullscreen Button - Responsive */}
              <button
                onClick={handleExpand}
                className="flex items-center gap-0.5 sm:gap-1 md:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 text-[9px] sm:text-xs md:text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all duration-200 hover:border-blue-500 hover:text-blue-600 shadow-sm hover:shadow-md cursor-pointer"
                title="Expand to fullscreen"
                aria-label="Expand preview to fullscreen"
              >
                <Maximize2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Preview Content - No overflow scrolling */}
        <div className="bg-slate-100 p-0 sm:p-2 md:p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {viewMode === 'desktop' ? (
          <div 
            className="bg-gray-50" 
            style={{ 
              margin: '0',
              padding: '0',
              minHeight: '100%',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji',
              backgroundColor: pageBg
            }}
          >
            {/* Page container - exact match from script */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: isSplitLayout ? '1.1fr .9fr' : '1fr',
                alignItems: 'stretch',
                gap: '0'
              }}
            >
              {/* Left side for split layout */}
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
              
              {/* Root container - minimal padding for preview */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '56px 8px'
                }}
              >
                {/* Wrap container - wider for desktop preview */}
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '680px',
                    background: formBg,
                    backdropFilter: 'saturate(180%) blur(8px)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                    padding: '28px',
                    boxSizing: 'border-box'
                  }}
                >
                  <FormContent />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="bg-gray-50" 
            style={{ 
              margin: '0',
              padding: '0',
              minHeight: '100%',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji',
              backgroundColor: pageBg
            }}
          >
            {/* Mobile view - same structure but single column */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                alignItems: 'stretch',
                gap: '0'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '8px'
                }}
              >
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: formBg,
                    backdropFilter: 'saturate(180%) blur(8px)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                    padding: '16px',
                    boxSizing: 'border-box'
                  }}
                >
                  <FormContent />
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LivePreview;

