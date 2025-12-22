'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minimize2 } from 'lucide-react';
import { FormField } from '@/components/FormBuilder/types';
import { normalizeThemeLayout } from '@/components/FormBuilder/utils';

export default function PreviewPage() {
  const router = useRouter();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [theme, setTheme] = useState<any>({});
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [countryData, setCountryData] = useState<Array<{ countryName: string; countryShortCode: string; regions: Array<{ name: string; shortCode?: string }>;}>>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');

  useEffect(() => {
    // Load form data from sessionStorage
    try {
      const storedData = sessionStorage.getItem('previewFormData');
      if (storedData) {
        const data = JSON.parse(storedData);
        setFormFields(data.formFields || []);
        setTheme(data.theme || {});
        setViewMode(data.viewMode || 'desktop');
      } else {
        // If no data, redirect back
        router.back();
      }
    } catch (error) {
      console.error('Failed to load preview data:', error);
      router.back();
    }
  }, [router]);

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

  const normalizedTheme = normalizeThemeLayout(theme);
  const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
  const isSplitLayout = normalizedTheme.layout === 'split' && hasValidImageUrl;
  
  const pr = normalizedTheme.primaryColor || '#2563eb';
  const ttl = normalizedTheme.title || 'Create your account';
  const sub = normalizedTheme.subtitle || 'Please fill in the form to continue';
  const btnbg = normalizedTheme.buttonBg || pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  const formBg = normalizedTheme.formBackgroundColor || '#ffffff';

  const handleShrink = () => {
    router.back();
  };

  const renderField = (field: FormField) => {
    const borderColor = field.borderColor || '#e5e7eb';
    const borderWidth = field.borderWidth || '1';
    const borderRadius = field.borderRadius || '10';
    const bgColor = field.bgColor || '#fff';
    const padding = field.padding || '12';
    const fontSize = field.fontSize || '14';
    const textColor = field.textColor || '#0f172a';
    
    return (
      <div key={field.id}>
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

  if (!formFields.length) {
    return null;
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
      `}</style>
      
      {/* Floating Shrink Button */}
      <button
        onClick={handleShrink}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900/90 hover:bg-gray-800 backdrop-blur-sm border border-gray-700/50 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        title="Exit fullscreen"
        aria-label="Exit fullscreen preview"
      >
        <Minimize2 className="w-4 h-4" />
        <span>Exit Fullscreen</span>
      </button>

      {/* Fullscreen Form Preview */}
      <div 
        className="h-screen w-screen overflow-auto"
        style={{ 
          margin: '0',
          padding: '0',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji',
          backgroundColor: '#f9fafb'
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
                  maxWidth: '520px',
                  background: formBg,
                  backdropFilter: 'saturate(180%) blur(8px)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                  padding: '28px'
                }}
              >
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
                
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#475569',
                    margin: '0 0 18px 0'
                  }}
                >
                  {sub}
                </p>
                
                <form style={{ display: 'grid', gap: '14px' }}>
                  {groupedFields.map((group) => {
                    const isMobile = viewMode === 'mobile';
                    const isPaired = group.rowGroup != null && group.fields.length === 2 && !isMobile;
                    
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
                  backdropFilter: 'saturate(180%) blur(8px)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '16px',
                  boxShadow: '0 20px 30px -15px rgba(0,0,0,.2)',
                  padding: '28px',
                  marginTop: '8px'
                }}
              >
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
                
                <p 
                  style={{
                    fontSize: '13px',
                    color: '#475569',
                    margin: '0 0 18px 0'
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
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

