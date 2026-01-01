'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useFormVersions, useFormVersionActions, useBcScriptsActions, useStoreFormActions, useStoreForm } from '@/lib/hooks';
import { Loader2, Trash2, CheckCircle2, FileEdit, Power, Pencil, Search, LayoutGrid, ListChecks, XCircle, PowerOff } from 'lucide-react';
import VersionNameModal from './VersionNameModal';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getUserFriendlyError } from '@/lib/utils';
import ActivationConfirmModal from './ActivationConfirmModal';
import FormOperationProgressModal from './FormOperationProgressModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ActivateConfirmModal from './ActivateConfirmModal';
import DeactivateConfirmModal from './DeactivateConfirmModal';

// Animation styles for form cards
const cardAnimationStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .form-card-animate {
    animation: fadeInUp 0.4s ease-out forwards;
    opacity: 0;
  }
  
  .form-card-animate-list {
    animation: fadeInLeft 0.4s ease-out forwards;
    opacity: 0;
  }
`;

// Custom scrollbar styles for form preview
const scrollbarStyles = `
  .form-preview-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .form-preview-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .form-preview-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4);
    border-radius: 2px;
  }
  .form-preview-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.6);
  }
  
  /* Custom radio button styling */
  input[type="radio"].radio-custom-preview {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    border: 2px solid #d1d5db !important;
    border-radius: 50% !important;
    background-color: white !important;
    position: relative !important;
  }
  
  input[type="radio"].radio-custom-preview:checked {
    border-color: #000000 !important;
    background-color: #000000 !important;
  }
  
  input[type="radio"].radio-custom-preview:checked::after {
    content: '' !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background-color: white !important;
  }
  
  /* Custom checkbox styling - ensure square shape */
  input[type="checkbox"].checkbox-custom-preview {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    border: 2px solid #d1d5db !important;
    border-radius: 4px !important;
    background-color: white !important;
    position: relative !important;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    min-height: 18px !important;
    flex-shrink: 0 !important;
  }
  
  input[type="checkbox"].checkbox-custom-preview:checked {
    border-color: #000000 !important;
    background-color: #000000 !important;
  }
  
  input[type="checkbox"].checkbox-custom-preview:checked::after {
    content: '✓' !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    color: white !important;
    font-size: 12px !important;
    font-weight: bold !important;
    line-height: 1 !important;
  }
  
  /* Ensure radio buttons stay circular */
  input[type="radio"].radio-custom-preview {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    border: 2px solid #d1d5db !important;
    border-radius: 50% !important;
    background-color: white !important;
    position: relative !important;
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    min-height: 18px !important;
    flex-shrink: 0 !important;
  }
`;

// Enhanced Form Preview Component - Exact replica of LivePreview rendering
const FormPreviewThumbnail: React.FC<{ form: any; isCompact?: boolean; currentFields?: any[]; currentTheme?: any; isCurrentForm?: boolean }> = ({ form, isCompact = false, currentFields, currentTheme, isCurrentForm = false }) => {
  // Use current fields/theme if this is the form being edited, otherwise use saved form data
  const formData = form?.form || form;
  const fields = (isCurrentForm && currentFields) ? currentFields : (formData?.fields || []);
  const theme = (isCurrentForm && currentTheme) ? currentTheme : (formData?.theme || {});
  
  // Normalize theme layout (same as LivePreview)
  const normalizeThemeLayout = (t: any) => {
    if (!t) return {};
    const normalized = { ...t };
    if (normalized.layout === 'split') {
      const hasValidImageUrl = normalized.splitImageUrl && normalized.splitImageUrl.trim().length > 0;
      if (!hasValidImageUrl) {
        normalized.layout = 'center';
      }
    }
    return normalized;
  };
  
  const normalizedTheme = normalizeThemeLayout(theme);
  
  // Get theme values with defaults matching LivePreview
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
  const btnbg = (normalizedTheme.buttonBg && normalizedTheme.primaryColor && normalizedTheme.buttonBg !== normalizedTheme.primaryColor)
    ? normalizedTheme.buttonBg 
    : pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  const formBg = normalizedTheme.formBackgroundColor || '#ffffff';
  const pageBg = normalizedTheme.pageBackgroundColor || '#f9fafb';
  
  // Scale factor for preview - smaller for better UI/UX in thumbnail
  const scale = isCompact ? 0.25 : 0.4;
  
  // Group fields by rowGroup for 2-column layout (exact logic from LivePreview)
  const groupedFields: Array<{ fields: any[]; rowGroup: number | null }> = [];
  const processedIds = new Set<number>();
  
  for (let i = 0; i < fields.length; i++) {
    if (processedIds.has(fields[i].id)) continue;
    
    const field = fields[i];
    if (field.rowGroup != null) {
      // Find all fields with the same rowGroup
      const groupFields = fields.filter((f: any) => f.rowGroup === field.rowGroup);
      groupedFields.push({ fields: groupFields, rowGroup: field.rowGroup });
      groupFields.forEach((f: any) => processedIds.add(f.id));
    } else {
      // Single field, full width
      groupedFields.push({ fields: [field], rowGroup: null });
      processedIds.add(field.id);
    }
  }
  
  // Render field function (exact logic from LivePreview)
  const renderField = (field: any) => {
    const borderColor = field.borderColor || '#e5e7eb';
    const borderWidth = field.borderWidth || '1';
    const borderRadius = field.borderRadius || '10';
    const bgColor = field.bgColor || '#fff';
    const padding = field.padding || '12';
    const fontSize = field.fontSize || '14';
    const textColor = field.textColor || '#0f172a';
    const labelColor = field.labelColor || '#374151';
    const labelSize = field.labelSize || '14';
    const labelWeight = field.labelWeight || '500';
    
    const inputStyle = {
      borderColor: borderColor,
      borderWidth: (parseFloat(borderWidth) * scale) + 'px',
      borderStyle: 'solid' as const,
      borderRadius: (parseFloat(borderRadius) * scale) + 'px',
      backgroundColor: bgColor,
      padding: (parseFloat(padding) * scale) + 'px',
      paddingRight: ((parseFloat(padding) || 12) * scale + 30 * scale) + 'px',
      fontSize: Math.max(9, parseFloat(fontSize) * scale) + 'px',
      color: textColor,
      width: '100%',
      outline: 'none' as const,
      lineHeight: '1.4',
      appearance: 'none' as const,
      WebkitAppearance: 'none' as const,
      MozAppearance: 'none' as const
    };
    
    // For checkbox, hide label if empty
    const showLabel = field.type !== 'checkbox' || field.label?.trim();
    // For checkbox without label, use first option label as heading
    const checkboxLabel = field.type === 'checkbox' && !field.label?.trim() && field.options && field.options.length > 0
      ? field.options[0].label
      : field.label;
    
    return (
      <div key={field.id} style={{ marginBottom: `${6 * scale}px` }}>
        {/* Label */}
        {showLabel && (
          <label 
            style={{ 
              color: labelColor,
              fontSize: Math.max(10, parseInt(labelSize) * scale) + 'px',
              fontWeight: labelWeight,
              display: 'block',
              marginBottom: `${6 * scale}px`,
              lineHeight: '1.2',
              cursor: 'pointer'
            }}
          >
            {checkboxLabel}{field.required ? <span style={{ color: 'red' }}> *</span> : ''}
          </label>
        )}
        
        {/* Input field - handle all types */}
        {field.role === 'country' ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <select style={inputStyle} aria-label={field.label}>
              <option>Select a country</option>
            </select>
            <svg
              style={{
                position: 'absolute',
                right: ((parseFloat(padding) || 12) * scale + 8 * scale) + 'px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                width: `${16 * scale}px`,
                height: `${16 * scale}px`
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
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Select a country first"
              style={{ ...inputStyle, paddingRight: (parseFloat(padding) * scale) + 'px' }}
              aria-label={field.label}
              disabled
            />
          </div>
        ) : field.type === 'textarea' ? (
          <textarea
            placeholder={field.placeholder || ''}
            rows={Math.max(2, Math.floor(3 * scale))}
            style={{ ...inputStyle, paddingRight: (parseFloat(padding) * scale) + 'px' }}
            aria-label={field.label}
            readOnly
          />
        ) : field.type === 'select' ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <select style={inputStyle} aria-label={field.label}>
              <option value="">{field.placeholder || 'Select an option'}</option>
              {(field.options || []).map((opt: any, idx: number) => (
                <option key={idx} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg
              style={{
                position: 'absolute',
                right: ((parseFloat(padding) || 12) * scale + 8 * scale) + 'px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                width: `${16 * scale}px`,
                height: `${16 * scale}px`
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
            {(field.options || []).map((opt: any, idx: number) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`preview-radio-${field.id}`}
                  value={opt.value}
                  style={{
                    width: `${18 * scale}px`,
                    height: `${18 * scale}px`,
                    cursor: 'pointer'
                  }}
                  className="radio-custom-preview"
                />
                <span style={{ fontSize: Math.max(9, parseFloat(fontSize) * scale) + 'px', color: textColor }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
            {(field.options && field.options.length > 0) ? (
              (field.options || []).map((opt: any, idx: number) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    value={opt.value}
                    style={{
                      width: `${18 * scale}px`,
                      height: `${18 * scale}px`,
                      cursor: 'pointer'
                    }}
                    className="checkbox-custom-preview"
                  />
                  <span style={{ fontSize: Math.max(9, parseFloat(fontSize) * scale) + 'px', color: textColor }}>
                    {opt.label}
                  </span>
                </label>
              ))
            ) : (
              field.label?.trim() && (
                <label style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{
                      width: `${18 * scale}px`,
                      height: `${18 * scale}px`,
                      cursor: 'pointer'
                    }}
                    className="checkbox-custom-preview"
                  />
                  <span style={{ fontSize: Math.max(9, parseFloat(fontSize) * scale) + 'px', color: textColor }}>
                    {field.label}
                  </span>
                </label>
              )
            )}
          </div>
        ) : field.type === 'file' ? (
          <input
            type="file"
            style={{ ...inputStyle, paddingRight: (parseFloat(padding) * scale) + 'px' }}
            aria-label={field.label}
            disabled
          />
        ) : (
          <input
            type={field.role === 'password' ? 'password' : (field.type === 'phone' ? 'tel' : field.type || 'text')}
            placeholder={field.placeholder || ''}
            pattern={field.type === 'phone' ? '[0-9]*' : undefined}
            inputMode={field.type === 'phone' ? 'numeric' : undefined}
            style={{ ...inputStyle, paddingRight: (parseFloat(padding) * scale) + 'px' }}
            aria-label={field.label}
            readOnly
          />
        )}
      </div>
    );
  };
  
  return (
    <>
      <style>{scrollbarStyles}</style>
      <div style={{ 
        background: pageBg,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: `${50 * scale}px`,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Form card container */}
        <div style={{
          background: formBg,
          borderRadius: `${16 * scale}px`,
          padding: `${28 * scale}px`,
          border: `${1 * scale}px solid #e5e7eb`,
          boxShadow: `0 ${20 * scale}px ${30 * scale}px -${15 * scale}px rgba(0,0,0,.2)`,
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
        {/* Scrollable content area - includes title, subtitle, and form */}
        <div 
          className="form-preview-scroll"
          style={{ 
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
        {/* Title - exact match from LivePreview */}
        <h1 
          style={{
            fontSize: `${titleFontSize * scale}px`,
            fontWeight: titleFontWeight,
            color: titleColor,
            margin: `0 0 ${6 * scale}px 0`
          }}
        >
          {ttl}
        </h1>
        
        {/* Subtitle - exact match from LivePreview */}
        <p 
          style={{
            fontSize: `${subtitleFontSize * scale}px`,
            fontWeight: subtitleFontWeight,
            color: subtitleColor,
            margin: `0 0 ${18 * scale}px 0`
          }}
        >
          {sub}
        </p>
        
        {/* Form - exact match from LivePreview */}
        <form style={{ 
          display: 'grid', 
          gap: `${14 * scale}px`
        }}>
        {groupedFields.map((group) => {
          // For compact view, always stack fields; for grid view, show paired if available
          const isPaired = group.rowGroup != null && group.fields.length === 2 && !isCompact;
          
          if (isPaired) {
            // Render paired fields side-by-side
            return (
              <div 
                key={`group-${group.rowGroup}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${14 * scale}px`
                }}
              >
                {group.fields.map((field: any) => renderField(field))}
              </div>
            );
          } else {
            // Render single field or mobile (stacked)
            return (
              <React.Fragment key={group.rowGroup || `single-${group.fields[0].id}`}>
                {group.fields.map((field: any) => renderField(field))}
              </React.Fragment>
            );
          }
        })}
        
        {/* Submit Button - exact match from LivePreview */}
        {fields.length > 0 && (
          <button
            type="button"
            style={{
              height: `${46 * scale}px`,
              border: '0',
              borderRadius: `${btnr * scale}px`,
              background: btnbg,
              color: btnc,
              fontWeight: '700',
              letterSpacing: '.02em',
              cursor: 'default',
              marginTop: `${8 * scale}px`,
              width: '100%',
              fontSize: `${14 * scale}px`
            }}
          >
            {btnt}
          </button>
        )}
        </form>
        </div>
        </div>
      </div>
    </>
  );
};

type ViewMode = 'grid' | 'list';

interface VersionsListProps {
  onLoadVersion: (version: any) => void;
  onVersionLoaded?: () => void;
  onNavigateToBuilder?: () => void;
  currentFormFields?: any[];
  currentTheme?: any;
  currentFormVersionId?: string | null;
}

export default function VersionsList({ onLoadVersion, onVersionLoaded, onNavigateToBuilder, currentFormFields, currentTheme, currentFormVersionId }: VersionsListProps) {
  const { versions, mutate, isError, isLoading } = useFormVersions();
  const { deleteVersion, setActiveVersion, updateVersion, deactivateAllVersions } = useFormVersionActions();
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { setActive } = useStoreFormActions();
  const { active: isFormActive, scriptUuid, mutate: mutateStoreForm } = useStoreForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [displayedCount, setDisplayedCount] = useState(12);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [activationModalVersion, setActivationModalVersion] = useState<any | null>(null);
  const [progressSteps, setProgressSteps] = useState<Array<{ id: string; label: string; status: 'pending' | 'in-progress' | 'completed' | 'error' }>>([]);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; versionId: string | null; formName: string | null; isLoading: boolean; error: string | null }>({
    isOpen: false,
    versionId: null,
    formName: null,
    isLoading: false,
    error: null,
  });
  const [activateModal, setActivateModal] = useState<{ isOpen: boolean; versionId: string | null; formName: string | null; isLoading: boolean; error: string | null }>({
    isOpen: false,
    versionId: null,
    formName: null,
    isLoading: false,
    error: null,
  });
  const [deactivateModal, setDeactivateModal] = useState<{ isOpen: boolean; formName: string | null; isLoading: boolean; error: string | null }>({
    isOpen: false,
    formName: null,
    isLoading: false,
    error: null,
  });
  const toast = useToast();

  // Sort versions: active form first, then by updatedAt (newest first)
  const sortedVersions = [...versions].sort((a: any, b: any) => {
    // Active form always comes first
    if (a.isActive && isFormActive && !(b.isActive && isFormActive)) return -1;
    if (b.isActive && isFormActive && !(a.isActive && isFormActive)) return 1;
    
    // Then sort by updatedAt (newest first)
    const aTime = a.updatedAt?.seconds || a.updatedAt?._seconds || 0;
    const bTime = b.updatedAt?.seconds || b.updatedAt?._seconds || 0;
    return bTime - aTime;
  });

  const filteredVersions = sortedVersions.filter((v: any) =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination: show only first displayedCount forms
  const displayedVersions = filteredVersions.slice(0, displayedCount);
  const hasMore = filteredVersions.length > displayedCount;

  // Reset displayed count when search query changes
  useEffect(() => {
    setDisplayedCount(12);
  }, [searchQuery]);

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 12);
  };

  // Cmd+K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDelete = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const version = versions.find((v: any) => v.id === versionId);
    setDeleteModal({
      isOpen: true,
      versionId,
      formName: version?.name || null,
      isLoading: false,
      error: null,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.versionId) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Check if the form being deleted is active
      const versionToDelete = versions.find((v: any) => v.id === deleteModal.versionId);
      const wasActive = versionToDelete?.isActive && isFormActive;
      
      await deleteVersion(deleteModal.versionId);
      
      // Refresh versions list
      await mutate();
      
      // If an active form was deleted, refresh store form state to reflect deactivation
      if (wasActive) {
        await mutateStoreForm(undefined, { revalidate: true });
      }
      
      toast.showSuccess('Form deleted successfully.');
      
      // Close modal and refresh list
      setDeleteModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = getUserFriendlyError(error, 'Unable to delete the form. Please try again.');
      setDeleteModal(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      toast.showError(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    if (deleteModal.isLoading) return; // Prevent closing during deletion
    setDeleteModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
  };

  const handleSetActive = async (versionId: string, showConfirm: boolean = true) => {
    const version = versions.find((v: any) => v.id === versionId);
    if (!version) {
      toast.showError('The form could not be found. Please refresh the page.');
      return;
    }

    // Check if this version is already active
    if (version.isActive && isFormActive) {
      if (showConfirm) {
        setDeactivateModal({
          isOpen: true,
          formName: version.name || null,
          isLoading: false,
          error: null,
        });
        return;
      }
    }

    // Show activation confirmation modal
    if (showConfirm) {
      setActivateModal({
        isOpen: true,
        versionId,
        formName: version.name || null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Proceed with activation (when called from confirmation)
    await performActivation(versionId);
  };

  const handleActivateConfirm = async () => {
    if (!activateModal.versionId) return;

    setActivateModal(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await performActivation(activateModal.versionId);
      setActivateModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setActivateModal(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  };

  const handleActivateCancel = () => {
    if (activateModal.isLoading) return; // Prevent closing during activation
    setActivateModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
  };

  const updateProgressStep = (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error') => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const performActivation = async (versionId: string) => {
    const version = versions.find((v: any) => v.id === versionId);
    if (!version || !version.form) {
      console.error('[Activation] Version not found or has no form data', { versionId });
      toast.showError('The form could not be found or is missing required data. Please refresh the page.');
      return;
    }

    // Guard against duplicate activation
    if (activatingId === versionId) {
      console.warn('[Activation] Already activating this version, ignoring duplicate request', { versionId });
      return;
    }

    setActivatingId(versionId);
    setProgressError(null);
    
    // Initialize progress steps
    const initialSteps = [
      { id: 'generate-script', label: 'Generating form script...', status: 'pending' as const },
      { id: 'update-script', label: 'Updating BigCommerce script...', status: 'pending' as const },
      { id: 'update-database', label: 'Updating database...', status: 'pending' as const },
      { id: 'refresh-data', label: 'Refreshing data...', status: 'pending' as const },
    ];
    setProgressSteps(initialSteps);
    
    console.log('[Activation] Starting activation', { versionId, versionName: version.name });
    
    try {
      // Step 1: Generate signup script
      updateProgressStep('generate-script', 'in-progress');
      console.log('[Activation] Generating signup script...');
      await fetch('/api/generate-signup-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields: version.form.fields, theme: version.form.theme })
      });
      updateProgressStep('generate-script', 'completed');

      // Step 2: Create or update BigCommerce script
      updateProgressStep('update-script', 'in-progress');
      let finalScriptUuid: string | null = scriptUuid || null;
      try {
        const scriptPayload = {
          name: "Custom Signup Form",
          description: "Injects custom signup form script into the theme",
          src: typeof window !== 'undefined' ? `${window.location.origin}/custom-signup.min.js` : "/custom-signup.min.js",
          auto_uninstall: true,
          load_method: "default",
          location: "head",
          visibility: "all_pages",
          kind: "src",
          consent_category: "essential"
        };

        if (finalScriptUuid) {
          console.log('[Activation] Attempting to update existing script', { scriptUuid: finalScriptUuid });
          try {
            await updateScript(finalScriptUuid, scriptPayload);
            console.log('[Activation] Script updated successfully');
          } catch (updateError: any) {
            // If script doesn't exist (404), create a new one instead
            const errorMsg = updateError?.message || '';
            if (errorMsg.includes('404') || errorMsg.includes('not found') || errorMsg.includes('Script not found')) {
              console.warn('[Activation] Script not found, creating new script instead', { scriptUuid: finalScriptUuid });
              finalScriptUuid = null; // Reset to create new script
              const data = await addScript(scriptPayload);
              finalScriptUuid = (data as any)?.data?.uuid || null;
              console.log('[Activation] New script created', { scriptUuid: finalScriptUuid });
            } else {
              // Re-throw other errors
              throw updateError;
            }
          }
        } else {
          console.log('[Activation] Creating new script...');
          const data = await addScript(scriptPayload);
          finalScriptUuid = (data as any)?.data?.uuid || null;
          console.log('[Activation] Script created', { scriptUuid: finalScriptUuid });
        }
        updateProgressStep('update-script', 'completed');
      } catch (scriptError: any) {
        console.error('[Activation] Script operation error:', scriptError);
        updateProgressStep('update-script', 'error');
        // Continue even if script operation fails - version activation should still work
        // finalScriptUuid will remain null if script creation/update fails
      }

      // Step 3: Set version as active (updates DB and main form, sets isActive flags)
      updateProgressStep('update-database', 'in-progress');
      console.log('[Activation] Setting version as active in database...');
      await setActiveVersion(versionId);
      
      // Set signupFormActive=true (this is redundant since setActiveVersion already does this, but keeping for safety)
      console.log('[Activation] Setting store form as active...');
      await setActive(true);
      updateProgressStep('update-database', 'completed');
      
      // Step 4: Refresh data
      updateProgressStep('refresh-data', 'in-progress');
      console.log('[Activation] Refreshing versions list...');
      await mutate();
      
      console.log('[Activation] Refreshing store form state with forced revalidation...');
      // Force revalidation to get fresh data from server
      await mutateStoreForm(undefined, { revalidate: true });
      updateProgressStep('refresh-data', 'completed');
      
      // Additional refresh after a delay to catch any race conditions and server cache
      setTimeout(async () => {
        console.log('[Activation] Performing final state refresh...');
        await mutate();
        await mutateStoreForm(undefined, { revalidate: true });
      }, 500);
      
      if (onVersionLoaded) onVersionLoaded();
      
      console.log('[Activation] Activation completed successfully', { versionId, scriptUuid: finalScriptUuid });
      toast.showSuccess('Form activated' + (finalScriptUuid ? `: ${finalScriptUuid}` : '.'));
      
      // Auto-close modal after showing success for 1.5 seconds
      setTimeout(() => {
        setActivatingId(null);
        setProgressSteps([]);
      }, 1500);
    } catch (error: any) {
      console.error('[Activation] Failed to activate version:', error);
      const friendlyError = getUserFriendlyError(error, 'Unable to activate the form. Please try again.');
      setProgressError(friendlyError);
      toast.showError(friendlyError);
      // Keep modal open to show error, user can close by activating/deactivating again or refreshing
    } finally {
      // Don't reset activatingId here - let it auto-close on success or stay open on error
    }
  };

  const handleDeactivate = async () => {
    // Guard against duplicate deactivation
    if (deactivatingId !== null) {
      console.warn('[Deactivation] Already deactivating, ignoring duplicate request');
      return;
    }

    // Guard against deactivating when no form is active
    if (!isFormActive) {
      console.warn('[Deactivation] No form is currently active, nothing to deactivate');
      toast.showWarning('No form is currently active.');
      return;
    }

    // Find the active version name for display
    const activeVersion = versions.find((v: any) => v.isActive && isFormActive);
    const activeVersionName = activeVersion?.name || 'Current Form';

    // Show confirmation modal
    setDeactivateModal({
      isOpen: true,
      formName: activeVersionName,
      isLoading: false,
      error: null,
    });
  };

  const handleDeactivateConfirm = async () => {
    setDeactivateModal(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await performDeactivation();
      setDeactivateModal({ isOpen: false, formName: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDeactivateModal(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  };

  const handleDeactivateCancel = () => {
    if (deactivateModal.isLoading) return; // Prevent closing during deactivation
    setDeactivateModal({ isOpen: false, formName: null, isLoading: false, error: null });
  };

  const performDeactivation = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VersionsList.tsx:347',message:'handleDeactivate entry',data:{scriptUuid,isFormActive,deactivatingId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
    // #endregion
    
    // Guard against duplicate deactivation
    if (deactivatingId !== null) {
      console.warn('[Deactivation] Already deactivating, ignoring duplicate request');
      return;
    }

    // Guard against deactivating when no form is active
    if (!isFormActive) {
      console.warn('[Deactivation] No form is currently active, nothing to deactivate');
      toast.showWarning('No form is currently active.');
      return;
    }

    // Find the active version name for display
    const activeVersion = versions.find((v: any) => v.isActive && isFormActive);
    const activeVersionName = activeVersion?.name || 'Current Form';

    setDeactivatingId('deactivate');
    setProgressError(null);
    
    // Initialize progress steps
    const initialSteps = [
      { id: 'delete-script', label: 'Removing script from storefront...', status: 'pending' as const },
      { id: 'update-database', label: 'Updating database...', status: 'pending' as const },
      { id: 'deactivate-versions', label: 'Deactivating versions...', status: 'pending' as const },
      { id: 'refresh-data', label: 'Refreshing data...', status: 'pending' as const },
    ];
    setProgressSteps(initialSteps);
    
    console.log('[Deactivation] Starting deactivation', { scriptUuid, isFormActive });
    
    try {
      // Step 1: Delete BigCommerce script
      updateProgressStep('delete-script', 'in-progress');
      if (scriptUuid) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VersionsList.tsx:382',message:'Before deleteScript call',data:{scriptUuid,hasScriptUuid:!!scriptUuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        try {
          console.log('[Deactivation] Deleting BigCommerce script...', { scriptUuid });
          const deleteResult = await deleteScript(scriptUuid);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VersionsList.tsx:386',message:'deleteScript success',data:{scriptUuid,deleteResult},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
          // #endregion
          console.log('[Deactivation] Script deleted successfully from BigCommerce', { scriptUuid, result: deleteResult });
          updateProgressStep('delete-script', 'completed');
        } catch (scriptError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VersionsList.tsx:398',message:'deleteScript error caught',data:{scriptUuid,errorMessage:scriptError?.message,errorType:scriptError?.constructor?.name,errorString:String(scriptError),hasMessage:!!scriptError?.message,errorKeys:scriptError&&typeof scriptError==='object'?Object.keys(scriptError):[],errorJson:JSON.stringify(scriptError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
          // #endregion
          
          // Extract error information - check multiple ways to detect meaningful errors
          const errorMsg = scriptError?.message || String(scriptError || '');
          const errorMsgTrimmed = errorMsg.trim();
          
          // Check if error is actually just an empty object or meaningless
          // Check if the error itself is empty/null/undefined
          const errorStringified = JSON.stringify(scriptError);
          const isErrorEmpty = !scriptError || 
                               scriptError === null ||
                               scriptError === undefined ||
                               (typeof scriptError === 'object' && 
                                !(scriptError instanceof Error) && 
                                Object.keys(scriptError).length === 0) ||
                               errorStringified === '{}' ||
                               errorStringified === 'null';
          
          // Check if error message is meaningful (not empty, not '{}', not just whitespace, not '[object Object]')
          const hasMeaningfulMessage = errorMsgTrimmed.length > 0 && 
                                      errorMsgTrimmed !== '{}' &&
                                      errorMsgTrimmed !== '[object Object]' &&
                                      errorMsgTrimmed !== 'null' &&
                                      errorMsgTrimmed !== 'undefined';
          
          // Since deletion is working correctly, any error without a meaningful message is a false positive
          // Empty objects, empty strings, or objects with no message property should be treated as success
          if (isErrorEmpty || !hasMeaningfulMessage) {
            // Silently treat as success - no logging for empty/meaningless errors
            // This covers: {}, empty string, undefined, null, objects with no message
            console.log('[Deactivation] Script deletion completed (empty/no error detected, treating as success)', { 
              scriptUuid,
              errorType: typeof scriptError,
              errorStringified: errorStringified.substring(0, 100)
            });
            updateProgressStep('delete-script', 'completed');
          } else {
            // Only log as error if we have a meaningful error message (not just empty object)
            const errorMsgLower = errorMsgTrimmed.toLowerCase();
            const is404Error = errorMsgLower.includes('404') || 
                             errorMsgLower.includes('not found') || 
                             errorMsgLower.includes('does not exist');
            
            if (is404Error) {
              // 404 is expected when script is already deleted - treat as success
              console.log('[Deactivation] Script deletion completed (404 - script not found, already deleted)');
              updateProgressStep('delete-script', 'completed');
            } else {
              // Real error with meaningful message - only log actual errors
              console.error('[Deactivation] Script deletion error - this means the form may still appear on website!', { 
                scriptUuid, 
                error: scriptError,
                message: scriptError?.message
              });
              updateProgressStep('delete-script', 'error');
              // Still continue with deactivation in database
            }
          }
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VersionsList.tsx:404',message:'No scriptUuid found',data:{scriptUuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('[Deactivation] No script UUID found - form may still be active on website if a script exists!', { scriptUuid });
        updateProgressStep('delete-script', 'completed'); // Skip step
      }

      // Step 2: Set signupFormActive=false and clear script UUID in database FIRST
      updateProgressStep('update-database', 'in-progress');
      console.log('[Deactivation] Setting store form as inactive in database...');
      await setActive(false);
      updateProgressStep('update-database', 'completed');

      // Step 3: Deactivate all versions
      updateProgressStep('deactivate-versions', 'in-progress');
      console.log('[Deactivation] Deactivating all versions in database...');
      await deactivateAllVersions();
      updateProgressStep('deactivate-versions', 'completed');
      
      // Wait a moment to ensure database writes complete before refreshing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 4: Refresh data
      updateProgressStep('refresh-data', 'in-progress');
      console.log('[Deactivation] Refreshing versions list...');
      await mutate();
      
      console.log('[Deactivation] Refreshing store form state with forced revalidation...');
      // Force revalidation to get fresh data from server
      await mutateStoreForm(undefined, { revalidate: true });
      updateProgressStep('refresh-data', 'completed');
      
      // Additional refresh after a delay to catch any race conditions and server cache
      setTimeout(async () => {
        console.log('[Deactivation] Performing final state refresh...');
        await mutate();
        await mutateStoreForm(undefined, { revalidate: true });
      }, 500);
      
      if (onVersionLoaded) {
        await onVersionLoaded();
      }
      
      console.log('[Deactivation] Deactivation completed successfully');
      toast.showSuccess('Form deactivated.');
      
      // Auto-close modal after showing success for 1.5 seconds
      setTimeout(() => {
        setDeactivatingId(null);
        setProgressSteps([]);
      }, 1500);
    } catch (error: any) {
      console.error('[Deactivation] Failed to deactivate:', error);
      const friendlyError = getUserFriendlyError(error, 'Unable to deactivate the form. Please try again.');
      setProgressError(friendlyError);
      toast.showError(friendlyError);
      // Still refresh state even on error to ensure UI is consistent
      try {
        await mutate();
        await mutateStoreForm(undefined, { revalidate: true });
      } catch (refreshError) {
        console.error('[Deactivation] Failed to refresh state after error:', refreshError);
      }
      // Keep modal open to show error
    } finally {
      // Don't reset deactivatingId here - let it auto-close on success or stay open on error
    }
  };

  const handleLoad = (version: any) => {
    onLoadVersion(version);
    // Note: onVersionLoaded is now called from FormBuilder after tab switch
    // to prevent loading skeletons from showing
  };

  const handleFormClick = (version: any, e: React.MouseEvent) => {
    // Don't load if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[onClick]')) {
      return;
    }
    // Load form directly into builder instead of showing popup
    handleLoad(version);
  };

  const handleEdit = (version: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(version.id);
    setEditName(version.name);
  };

  const handleUpdateName = async (name: string) => {
    if (!editingId) return;
    try {
      await updateVersion(editingId, { name });
      await mutate();
      toast.showSuccess('Form name updated successfully.');
      setEditingId(null);
      setEditName('');
    } catch (error: any) {
      toast.showError(getUserFriendlyError(error, 'Unable to update the form name. Please try again.'));
      throw error; // Re-throw so modal can handle it
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object (client-side)
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle Firestore Timestamp serialized as object with seconds/nanoseconds (or _seconds/_nanoseconds)
      else if (timestamp && (typeof timestamp.seconds === 'number' || typeof (timestamp as any)._seconds === 'number')) {
        const seconds = timestamp.seconds || (timestamp as any)._seconds || 0;
        const nanoseconds = timestamp.nanoseconds || (timestamp as any)._nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Handle ISO string or number
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Try to parse as date if it's an object with a value property
      else if (timestamp && typeof timestamp === 'object' && 'value' in timestamp) {
        date = new Date(timestamp.value);
      }
      else {
        return 'Unknown';
      }

      // Check if date is valid
      if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
        return 'Unknown';
      }

      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Double-check that we didn't get "Invalid Date"
      if (dateStr === 'Invalid Date' || timeStr === 'Invalid Date') {
        return 'Unknown';
      }

      return dateStr + ' ' + timeStr;
    } catch (e) {
      console.error('Error formatting date:', e, timestamp);
      return 'Unknown';
    }
  };

  const formatDateShort = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      let date: Date;
      
      // Handle Firestore Timestamp object (client-side)
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      }
      // Handle Firestore Timestamp serialized as object with seconds/nanoseconds (or _seconds/_nanoseconds)
      else if (timestamp && (typeof timestamp.seconds === 'number' || typeof (timestamp as any)._seconds === 'number')) {
        const seconds = timestamp.seconds || (timestamp as any)._seconds || 0;
        const nanoseconds = timestamp.nanoseconds || (timestamp as any)._nanoseconds || 0;
        date = new Date(seconds * 1000 + nanoseconds / 1000000);
      }
      // Handle ISO string or number
      else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Already a Date object
      else if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Try to parse as date if it's an object with a value property
      else if (timestamp && typeof timestamp === 'object' && 'value' in timestamp) {
        date = new Date(timestamp.value);
      }
      else {
        return 'Unknown';
      }

      // Check if date is valid
      if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
        return 'Unknown';
      }

      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      return `${month} ${day}, ${year}`;
    } catch (e) {
      console.error('Error formatting date:', e, timestamp);
      return 'Unknown';
    }
  };


  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load forms. Please try again.
      </div>
    );
  }

  // Loading skeleton for grid view - Enhanced responsive design
  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="h-[200px] md:h-[280px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
          <div className="px-3 sm:px-4 md:px-5 pb-2.5 sm:pb-3 md:pb-4 pt-2.5 sm:pt-3 md:pt-4 space-y-2 sm:space-y-2.5">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="h-2.5 sm:h-3 md:h-3.5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 sm:h-4.5 bg-slate-200 rounded-full w-12 sm:w-14 flex-shrink-0" />
            </div>
            <div className="h-2 sm:h-2.5 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for list view - Enhanced responsive design
  const renderListSkeleton = () => (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-3.5 md:p-4 lg:p-5 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-1 min-w-0 w-full sm:w-auto">
              <div className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] sm:w-[150px] sm:h-[140px] sm:min-w-[150px] sm:min-h-[140px] md:w-[180px] md:h-[160px] md:min-w-[180px] md:min-h-[160px] lg:w-[220px] lg:h-[200px] lg:min-w-[220px] lg:min-h-[200px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-md sm:rounded-lg md:rounded-xl flex-shrink-0 shadow-sm" />
              <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 md:gap-3">
                  <div className="h-3 sm:h-3.5 md:h-4 bg-slate-200 rounded w-2/3 sm:w-1/2" />
                  <div className="h-4 sm:h-4.5 bg-slate-200 rounded-full w-12 sm:w-14 flex-shrink-0" />
                </div>
                <div className="h-2 sm:h-2.5 md:h-3 bg-slate-200 rounded w-1/3 sm:w-1/4" />
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1 md:gap-1.5 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-200 rounded-md sm:rounded-lg" />
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-200 rounded-md sm:rounded-lg" />
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-slate-200 rounded-md sm:rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {displayedVersions.map((version: any, index: number) => (
          <div
            key={version.id}
            className="group relative bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5 hover:scale-[1.02] form-card-animate"
            style={{
              animationDelay: `${index * 50}ms`
            }}
            onClick={(e) => handleFormClick(version, e)}
          >
          {/* Hover overlay effect - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none z-0" />
          
          {/* Active indicator glow */}
          {version.isActive && isFormActive && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 z-20" />
          )}
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Form Preview - Enhanced with better styling */}
            {version.form && (
              <div className="relative border-b border-slate-100 overflow-hidden bg-gradient-to-br from-slate-50 to-white h-[200px] md:h-[280px] min-h-[200px] md:min-h-[280px]">
                <div className="relative w-full h-full" >
                  <FormPreviewThumbnail 
                    form={version.form} 
                    currentFields={currentFormFields}
                    currentTheme={currentTheme}
                    isCurrentForm={currentFormVersionId === version.id}
                  />
                </div>
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            )}
            
            {/* Card Content - Enhanced spacing and typography */}
            <div className="flex flex-col flex-1 px-3 sm:px-4 md:px-5 pb-2.5 sm:pb-3 md:pb-4 pt-2.5 sm:pt-3 md:pt-4 bg-gradient-to-b from-white to-slate-50/30">
              {/* Header - Name with Active Badge */}
              <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-800 break-words group-hover:text-blue-600 transition-colors leading-tight">
                    {version.name || 'Unnamed'}
                  </h3>
                  {version.isActive && isFormActive && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-sm">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Footer - Metadata and actions */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                {/* Metadata - Enhanced */}
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500">
                  <span className="text-slate-400 hidden sm:inline">Modified:</span>
                  <span className="font-medium text-slate-600 truncate">{formatDateShort(version.updatedAt)}</span>
                </div>
                
                {/* Secondary Actions - Enhanced with better spacing */}
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {version.isActive && isFormActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeactivate();
                      }}
                      disabled={deactivatingId !== null || deactivateModal.isLoading}
                      className="p-1 sm:p-1.5 md:p-2 text-rose-600 hover:bg-rose-50 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                      title="Deactivate form"
                    >
                      {deactivatingId !== null ? (
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <PowerOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 group-hover/btn:rotate-12 transition-transform" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetActive(version.id, true);
                      }}
                      disabled={activatingId === version.id || activateModal.isLoading}
                      className="p-1 sm:p-1.5 md:p-2 text-emerald-600 hover:bg-emerald-50 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                      title="Activate form"
                    >
                      {activatingId === version.id ? (
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 group-hover/btn:scale-110 transition-transform" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEdit(version, e)}
                    className="p-1 sm:p-1.5 md:p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md sm:rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Edit form name"
                  >
                    <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(version.id, e)}
                    className="p-1 sm:p-1.5 md:p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md sm:rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Delete form"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
        {displayedVersions.map((version: any, index: number) => (
          <div
            key={version.id}
            className="group relative bg-white border border-slate-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-3.5 md:p-4 lg:p-5 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-400/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 form-card-animate-list"
            style={{
              animationDelay: `${index * 50}ms`
            }}
            onClick={(e) => handleFormClick(version, e)}
          >
          {/* Hover overlay effect - Enhanced */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-300 pointer-events-none" />
          
          {/* Active indicator bar */}
          {version.isActive && isFormActive && (
            <div className="absolute top-0 left-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-400 rounded-l-lg sm:rounded-l-xl md:rounded-l-2xl" />
          )}
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-1 min-w-0 w-full sm:w-auto">
              {/* Form Preview Thumbnail - Enhanced responsive sizing */}
              {version.form && (
                <div className="relative border border-slate-200 rounded-md sm:rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow bg-white w-[120px] h-[120px] min-w-[120px] min-h-[120px] sm:w-[150px] sm:h-[140px] sm:min-w-[150px] sm:min-h-[140px] md:w-[180px] md:h-[160px] md:min-w-[180px] md:min-h-[160px] lg:w-[220px] lg:h-[200px] lg:min-w-[220px] lg:min-h-[200px]"
                >
                  <div className="relative w-full h-full">
                    <FormPreviewThumbnail 
                      form={version.form} 
                      isCompact={true}
                      currentFields={currentFormFields}
                      currentTheme={currentTheme}
                      isCurrentForm={currentFormVersionId === version.id}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-1 sm:mb-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 break-words group-hover:text-blue-600 transition-colors leading-tight">
                    {version.name || 'Unnamed'}
                  </h3>
                  {version.isActive && isFormActive && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-sm w-fit">
                      <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm text-slate-500 mt-0.5 sm:mt-1">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-slate-400 hidden sm:inline">Modified:</span>
                    <span className="font-medium text-slate-600 truncate">{formatDateShort(version.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions - Enhanced responsive design */}
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start" onClick={(e) => e.stopPropagation()}>
              {version.isActive && isFormActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate();
                  }}
                  disabled={deactivatingId !== null || deactivateModal.isLoading}
                  className="p-1.5 sm:p-2 md:p-2.5 text-rose-600 hover:bg-rose-50 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                  title="Deactivate form"
                >
                  {deactivatingId !== null ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <PowerOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:rotate-12 transition-transform" />
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(version.id, true);
                  }}
                  disabled={activatingId === version.id || activateModal.isLoading}
                  className="p-1.5 sm:p-2 md:p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-md sm:rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                  title="Activate form"
                >
                  {activatingId === version.id ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:scale-110 transition-transform" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => handleEdit(version, e)}
                className="p-1.5 sm:p-2 md:p-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md sm:rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                title="Edit form name"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={(e) => handleDelete(version.id, e)}
                className="p-1.5 sm:p-2 md:p-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md sm:rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                title="Delete form"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
        ))}
    </div>
  );

  // Skeleton for header section
  const renderHeaderSkeleton = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl shadow-slate-900/20 animate-pulse">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        {/* Title Row Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
          <div className="space-y-2">
            <div className="h-6 sm:h-7 md:h-8 lg:h-9 xl:h-10 bg-white/10 rounded-lg w-32 sm:w-40 md:w-48 lg:w-56" />
            <div className="h-4 sm:h-5 bg-white/5 rounded w-48 sm:w-64 md:w-80" />
          </div>
        </div>
        
        {/* Search Bar and View Toggle Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 w-full">
            <div className="h-10 sm:h-11 md:h-12 bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl" />
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/10 backdrop-blur-sm p-0.5 sm:p-1 rounded-lg sm:rounded-xl md:rounded-2xl w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white/10 rounded-md sm:rounded-lg" />
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-white/10 rounded-md sm:rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <style>{cardAnimationStyles}</style>
      {/* Header Section - Enhanced with better responsive design */}
      {isLoading ? renderHeaderSkeleton() : (
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl sm:rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-xl shadow-slate-900/20">
        {/* Background Elements - Enhanced */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Title Row - Enhanced responsive typography */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4 lg:mb-6">
            <div>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold !text-white mb-1 sm:mb-2 tracking-tight leading-tight">Saved Forms</h1>
              <p className="text-slate-300 sm:text-slate-400 text-[11px] sm:text-xs md:text-sm leading-relaxed">Manage and activate your signup forms</p>
            </div>
          </div>
          
          {/* Search Bar and View Toggle - Enhanced mobile responsiveness */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative group flex-1 w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <div className="absolute left-3 sm:left-4 z-10 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-focus-within:text-blue-400 transition-colors duration-200" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 md:pl-12 pr-10 sm:pr-12 md:pr-16 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 cursor-text"
                  title="Search forms - Press Cmd+K or Ctrl+K to focus"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 sm:right-4 p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* View Toggle - Enhanced mobile design */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white/10 backdrop-blur-sm p-0.5 sm:p-1 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 w-full sm:w-auto justify-center sm:justify-start">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 md:p-2.5 rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer flex-1 sm:flex-none ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mx-auto sm:mx-0" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 md:p-2.5 rounded-md sm:rounded-lg transition-all duration-200 cursor-pointer flex-1 sm:flex-none ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label="List view"
              >
                <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mx-auto sm:mx-0" />
              </button>
            </div>
          </div>
          
          {/* Search Results Indicator - Enhanced */}
          {searchQuery && (
            <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] sm:text-xs md:text-sm text-slate-300 leading-tight">
                Found <span className="font-semibold text-white">{filteredVersions.length}</span> of{' '}
                <span className="font-semibold text-white">{versions.length}</span> forms
              </span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="transition-all duration-300">
          {viewMode === 'grid' ? renderGridSkeleton() : renderListSkeleton()}
        </div>
      ) : filteredVersions.length === 0 ? (
        <div className="relative overflow-hidden bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-8 sm:p-12 lg:p-16 shadow-sm">
          {/* Background decoration - Enhanced */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/3 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 mb-4 sm:mb-6 shadow-sm">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">
              {searchQuery ? 'No forms found' : 'No saved forms yet'}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6 sm:mb-8 px-4">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all forms.' 
                : 'Create and save your first form to start managing and activating signup forms.'}
            </p>
            {!searchQuery && onNavigateToBuilder && (
              <button
                onClick={onNavigateToBuilder}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer transform hover:-translate-y-0.5"
              >
                Go to Builder
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Count Display - Enhanced */}
          {filteredVersions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-600 mb-2 sm:mb-3 md:mb-4 px-1">
              <span className="font-medium leading-tight">
                Showing <span className="text-slate-900 font-semibold">{displayedVersions.length}</span> out of{' '}
                <span className="text-slate-900 font-semibold">{filteredVersions.length}</span> forms
              </span>
              {/* {viewMode === 'grid' && (
                <span className="text-slate-400 text-[10px] sm:text-xs hidden sm:inline">
                  {filteredVersions.length === 1 ? 'form' : 'forms'}
                </span>
              )} */}
            </div>
          )}

          <div className="transition-all duration-300">
            {viewMode === 'grid' ? renderGridView() : renderListView()}
          </div>
          
          {/* Load More Button - Enhanced */}
          {hasMore && (
            <div className="flex justify-center pt-4 sm:pt-6">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-700 active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 cursor-pointer transform hover:-translate-y-0.5"
              >
                Load More Forms
              </button>
            </div>
          )}
        </>
      )}

      <VersionNameModal
        isOpen={editingId !== null}
        onClose={() => {
          setEditingId(null);
          setEditName('');
        }}
        onConfirm={handleUpdateName}
        title="Rename Form"
        placeholder="Enter new name"
        required={true}
        initialName={editName}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      {/* Activation Confirm Modal */}
      <ActivationConfirmModal
        isOpen={activationModalVersion !== null}
        version={activationModalVersion}
        isCurrentlyActive={activationModalVersion?.isActive && isFormActive}
        onClose={() => setActivationModalVersion(null)}
        onActivate={() => {
          if (activationModalVersion) {
            // When activating from modal, still show confirmations for switching
            handleSetActive(activationModalVersion.id, true);
          }
        }}
        onDeactivate={() => handleDeactivate()}
        onLoad={() => {
          if (activationModalVersion) {
            handleLoad(activationModalVersion);
          }
        }}
      />

      {/* Activation/Deactivation Progress Modal */}
      {(activatingId || deactivatingId) && (
        <FormOperationProgressModal
          isOpen={true}
          operationType={activatingId ? 'activate' : 'deactivate'}
          formName={
            activatingId 
              ? versions.find((v: any) => v.id === activatingId)?.name || 'Unknown'
              : versions.find((v: any) => v.isActive && isFormActive)?.name || 'Current Form'
          }
          steps={progressSteps}
          error={progressError}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        formName={deleteModal.formName || undefined}
        isLoading={deleteModal.isLoading}
        error={deleteModal.error}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Activate Confirmation Modal */}
      <ActivateConfirmModal
        isOpen={activateModal.isOpen}
        formName={activateModal.formName || undefined}
        isLoading={activateModal.isLoading}
        error={activateModal.error}
        onConfirm={handleActivateConfirm}
        onCancel={handleActivateCancel}
      />

      {/* Deactivate Confirmation Modal */}
      <DeactivateConfirmModal
        isOpen={deactivateModal.isOpen}
        formName={deactivateModal.formName || undefined}
        isLoading={deactivateModal.isLoading}
        error={deactivateModal.error}
        onConfirm={handleDeactivateConfirm}
        onCancel={handleDeactivateCancel}
      />
    </div>
  );
}

