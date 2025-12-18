'use client'

import React, { useEffect, useState } from 'react';
import { FormField } from './types';
import { normalizeThemeLayout } from './utils';

interface LivePreviewProps {
  formFields: FormField[];
  theme: any;
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
}

const LivePreview: React.FC<LivePreviewProps> = ({ formFields, theme, viewMode, onViewModeChange }) => {
  // Country/State dynamic data for address fields
  const [countryData, setCountryData] = useState<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }>;}>>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  
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
  const btnbg = normalizedTheme.buttonBg || pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  const formBg = normalizedTheme.formBackgroundColor || '#ffffff';
  
  // Form content component - matching exact script structure
  const FormContent = () => (
    <>
      {/* Title - exact match from script */}
      <h1 
        style={{
          fontSize: '22px',
          fontWeight: '800',
          color: '#0f172a',
          margin: '0 0 6px 0'
        }}
      >
        {ttl}
      </h1>
      
      {/* Subtitle - exact match from script */}
      <p 
        style={{
          fontSize: '13px',
          color: '#475569',
          margin: '0 0 18px 0'
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
            
            return (
              <div key={field.id}>
                {/* Label - exact match from script */}
                <label 
                  style={{ 
                    color: field.labelColor,
                    fontSize: field.labelSize + 'px',
                    fontWeight: field.labelWeight,
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  {field.label}{field.required ? ' *' : ''}
                </label>
                
                {/* Input field - exact match from script */}
                {field.role === 'country' ? (
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    style={{
                      borderColor: borderColor,
                      borderWidth: borderWidth + 'px',
                      borderStyle: 'solid',
                      borderRadius: borderRadius + 'px',
                      backgroundColor: bgColor,
                      padding: padding + 'px',
                      fontSize: fontSize + 'px',
                      color: textColor,
                      width: '100%',
                      outline: 'none'
                    }}
                    aria-label={field.label}
                  >
                    <option value="">Select a country</option>
                    {countryData.map(c => (
                      <option key={c.countryShortCode} value={c.countryShortCode}>{c.countryName}</option>
                    ))}
                  </select>
                ) : field.role === 'state' ? (
                  countryData.find(c => c.countryShortCode === selectedCountryCode)?.regions?.length ? (
                    <select
                      style={{
                        borderColor: borderColor,
                        borderWidth: borderWidth + 'px',
                        borderStyle: 'solid',
                        borderRadius: borderRadius + 'px',
                        backgroundColor: bgColor,
                        padding: padding + 'px',
                        fontSize: fontSize + 'px',
                        color: textColor,
                        width: '100%',
                        outline: 'none'
                      }}
                      aria-label={field.label}
                    >
                      <option value="">Select a state/province</option>
                      {countryData.find(c => c.countryShortCode === selectedCountryCode)!.regions.map((r, i) => (
                        <option key={(r.shortCode || r.name) + i} value={r.shortCode || r.name}>{r.name}</option>
                      ))}
                    </select>
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
                        padding: padding + 'px',
                        fontSize: fontSize + 'px',
                        color: textColor,
                        width: '100%',
                        outline: 'none'
                      }}
                      aria-label={field.label}
                      disabled={!selectedCountryCode}
                    />
                  )
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder || ''}
                    rows={3}
                    style={{
                      borderColor: borderColor,
                      borderWidth: borderWidth + 'px',
                      borderStyle: 'solid',
                      borderRadius: borderRadius + 'px',
                      backgroundColor: bgColor,
                      padding: padding + 'px',
                      fontSize: fontSize + 'px',
                      color: textColor,
                      width: '100%',
                      outline: 'none'
                    }}
                    aria-label={field.label}
                  />
                ) : field.type === 'select' ? (
                  <select
                    style={{
                      borderColor: borderColor,
                      borderWidth: borderWidth + 'px',
                      borderStyle: 'solid',
                      borderRadius: borderRadius + 'px',
                      backgroundColor: bgColor,
                      padding: padding + 'px',
                      fontSize: fontSize + 'px',
                      color: textColor,
                      width: '100%',
                      outline: 'none'
                    }}
                    aria-label={field.label}
                  >
                    <option>Select an option</option>
                  </select>
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    style={{
                      borderColor: borderColor,
                      borderWidth: borderWidth + 'px',
                      borderStyle: 'solid',
                      borderRadius: borderRadius + 'px',
                      backgroundColor: bgColor,
                      padding: padding + 'px',
                      fontSize: fontSize + 'px',
                      color: textColor,
                      width: '100%',
                      outline: 'none'
                    }}
                    aria-label={field.label}
                  />
                ) : (
                  <input
                    type={field.role === 'password' ? 'password' : (field.type === 'phone' ? 'tel' : field.type)}
                    placeholder={field.placeholder || ''}
                    style={{
                      borderColor: borderColor,
                      borderWidth: borderWidth + 'px',
                      borderStyle: 'solid',
                      borderRadius: borderRadius + 'px',
                      backgroundColor: bgColor,
                      padding: padding + 'px',
                      fontSize: fontSize + 'px',
                      color: textColor,
                      width: '100%',
                      outline: 'none'
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
        
        {/* Submit Button - exact match from script */}
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
    </>
  );
  
  return (
    <>
      {/* CSS keyframes matching script */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
      `}</style>
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">Live Preview</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onViewModeChange('desktop')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => onViewModeChange('mobile')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                viewMode === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>
        {viewMode === 'desktop' ? (
          <div 
            className="bg-gray-50" 
            style={{ 
              margin: '0',
              padding: '0',
              minHeight: '100%',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji'
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
                {/* Wrap container - exact match from script */}
                <div 
                  style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: formBg,
                    backdropFilter: 'saturate(180%) blur(8px)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                    padding: '28px'
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
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji'
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
                    padding: '28px'
                  }}
                >
                  <FormContent />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LivePreview;

