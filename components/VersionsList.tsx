'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useFormVersions, useFormVersionActions, useBcScriptsActions, useStoreFormActions, useStoreForm } from '@/lib/hooks';
import { Loader2, Trash2, CheckCircle2, FileEdit, Power, Pencil, Search, LayoutGrid, ListChecks, XCircle, PowerOff } from 'lucide-react';
import VersionNameModal from './VersionNameModal';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActivationConfirmModal from './ActivationConfirmModal';
import FormOperationProgressModal from './FormOperationProgressModal';
import DeleteConfirmModal from './DeleteConfirmModal';

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
`;

// Enhanced Form Preview Component - Exact replica of LivePreview rendering
const FormPreviewThumbnail: React.FC<{ form: any; isCompact?: boolean }> = ({ form, isCompact = false }) => {
  // Ensure we're using the correct form structure
  const formData = form?.form || form;
  const fields = formData?.fields || [];
  const theme = formData?.theme || {};
  
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
  const btnbg = normalizedTheme.buttonBg || pr;
  const btnc = normalizedTheme.buttonColor || '#fff';
  const btnr = normalizedTheme.buttonRadius == null ? 10 : normalizedTheme.buttonRadius;
  const btnt = normalizedTheme.buttonText || 'Create account';
  const formBg = normalizedTheme.formBackgroundColor || '#ffffff';
  
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
      fontSize: Math.max(9, parseFloat(fontSize) * scale) + 'px',
      color: textColor,
      width: '100%',
      outline: 'none' as const,
      lineHeight: '1.4'
    };
    
    return (
      <div key={field.id} style={{ marginBottom: `${6 * scale}px` }}>
        {/* Label */}
        <label 
          style={{ 
            color: labelColor,
            fontSize: Math.max(10, parseInt(labelSize) * scale) + 'px',
            fontWeight: labelWeight,
            display: 'block',
            marginBottom: `${6 * scale}px`,
            lineHeight: '1.2'
          }}
        >
          {field.label}{field.required ? ' *' : ''}
        </label>
        
        {/* Input field - handle all types */}
        {field.role === 'country' ? (
          <select style={inputStyle} aria-label={field.label}>
            <option>Select a country</option>
          </select>
        ) : field.role === 'state' ? (
          <input
            type="text"
            placeholder="Select a country first"
            style={inputStyle}
            aria-label={field.label}
            disabled
          />
        ) : field.type === 'textarea' ? (
          <textarea
            placeholder={field.placeholder || ''}
            rows={Math.max(2, Math.floor(3 * scale))}
            style={inputStyle}
            aria-label={field.label}
            readOnly
          />
        ) : field.type === 'select' ? (
          <select style={inputStyle} aria-label={field.label}>
            <option>Select an option</option>
          </select>
        ) : field.type === 'file' ? (
          <input
            type="file"
            style={inputStyle}
            aria-label={field.label}
            disabled
          />
        ) : (
          <input
            type={field.role === 'password' ? 'password' : (field.type === 'phone' ? 'tel' : field.type || 'text')}
            placeholder={field.placeholder || ''}
            style={inputStyle}
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
        background: formBg,
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
            fontSize: `${22 * scale}px`,
            fontWeight: '800',
            color: '#0f172a',
            margin: `0 0 ${6 * scale}px 0`
          }}
        >
          {ttl}
        </h1>
        
        {/* Subtitle - exact match from LivePreview */}
        <p 
          style={{
            fontSize: `${13 * scale}px`,
            color: '#475569',
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
    </>
  );
};

type ViewMode = 'grid' | 'list';

interface VersionsListProps {
  onLoadVersion: (version: any) => void;
  onVersionLoaded?: () => void;
  onNavigateToBuilder?: () => void;
}

export default function VersionsList({ onLoadVersion, onVersionLoaded, onNavigateToBuilder }: VersionsListProps) {
  const { versions, mutate, isError, isLoading } = useFormVersions();
  const { deleteVersion, setActiveVersion, updateVersion, deactivateAllVersions } = useFormVersionActions();
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { setActive } = useStoreFormActions();
  const { active: isFormActive, scriptUuid, mutate: mutateStoreForm } = useStoreForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);
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
      await deleteVersion(deleteModal.versionId);
      await mutate();
      toast.showSuccess('Form deleted successfully.');
      
      // Close modal and refresh list
      setDeleteModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDeleteModal(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      toast.showError('Failed to delete form: ' + errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    if (deleteModal.isLoading) return; // Prevent closing during deletion
    setDeleteModal({ isOpen: false, versionId: null, formName: null, isLoading: false, error: null });
  };

  const handleSetActive = async (versionId: string, showConfirm: boolean = true) => {
    const version = versions.find((v: any) => v.id === versionId);
    if (!version) {
      toast.showError('Form not found');
      return;
    }

    // Check if this version is already active
    if (version.isActive && isFormActive) {
      if (showConfirm) {
        setConfirmDialog({
          isOpen: true,
          title: 'Form Already Active',
          message: `"${version.name || 'Unnamed'}" is already active. Do you want to deactivate it?`,
          onConfirm: async () => {
            await handleDeactivate();
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          }
        });
        return;
      }
    }

    // Check if another form is currently active
    const currentlyActiveVersion = versions.find((v: any) => v.isActive && v.id !== versionId);
    if (currentlyActiveVersion && isFormActive && showConfirm) {
      setConfirmDialog({
        isOpen: true,
        title: 'Switch Active Form',
        message: `"${currentlyActiveVersion.name || 'Unnamed'}" is currently active. Do you want to activate "${version.name || 'Unnamed'}" and deactivate "${currentlyActiveVersion.name || 'Unnamed'}"?`,
        onConfirm: async () => {
          await performActivation(versionId);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      });
      return;
    }

    // Proceed with activation
    await performActivation(versionId);
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
      toast.showError('Form not found or has no form data');
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
      setProgressError(error?.message || 'Unknown error');
      toast.showError('Failed to activate form: ' + (error?.message || 'Unknown error'));
      // Keep modal open to show error, user can close by activating/deactivating again or refreshing
    } finally {
      // Don't reset activatingId here - let it auto-close on success or stay open on error
    }
  };

  const handleDeactivate = async () => {
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
          const errorMsg = scriptError?.message || '';
          const errorMsgTrimmed = errorMsg.trim();
          const hasMeaningfulMessage = errorMsgTrimmed.length > 0 && errorMsgTrimmed !== '{}';
          
          // Since deletion is working correctly, any error without a meaningful message is a false positive
          // Empty objects, empty strings, or objects with no message property should be treated as success
          if (!hasMeaningfulMessage) {
            // Silently treat as success - no logging for empty/meaningless errors
            // This covers: {}, empty string, undefined, null, objects with no message
            updateProgressStep('delete-script', 'completed');
          } else {
            // Only log as error if we have a meaningful error message (not just empty object)
            const errorMsgLower = errorMsgTrimmed.toLowerCase();
            const is404Error = errorMsgLower.includes('404') || 
                             errorMsgLower.includes('not found') || 
                             errorMsgLower.includes('does not exist');
            
            if (is404Error) {
              // 404 is expected when script is already deleted - treat as success
              updateProgressStep('delete-script', 'completed');
            } else {
              // Real error with meaningful message
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
      setProgressError(error?.message || 'Unknown error');
      toast.showError('Failed to deactivate: ' + (error?.message || 'Unknown error'));
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
    if (onVersionLoaded) onVersionLoaded();
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
      setEditingId(null);
      setEditName('');
    } catch (error: any) {
      toast.showError('Failed to update form name: ' + (error?.message || 'Unknown error'));
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

  // Loading skeleton for grid view
  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
          <div className="h-48 bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for list view
  const renderListSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-32 h-24 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredVersions.map((version: any) => (
        <div
          key={version.id}
          className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-400/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
          onClick={(e) => handleFormClick(version, e)}
        >
          {/* Hover overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-all duration-300 pointer-events-none z-0" />
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Form Preview - Enhanced with better styling, no gray background */}
            {version.form && (
              <div className="relative border-b border-slate-200 overflow-hidden" style={{ height: '290px', minHeight: '290px' }}>
                {/* Form Preview Content - Restore scale transform */}
                <div className="relative w-full h-full" >
                  <FormPreviewThumbnail form={version.form} />
                </div>
              </div>
            )}
            
            {/* Card Content - Minimal footer like Google Docs */}
            <div className="flex flex-col flex-1 px-5 pb-4 pt-3">
              {/* Header - Name with Active Badge */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                    {version.name || 'Unnamed'}
                  </h3>
                  {version.isActive && isFormActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Minimal Footer - Just metadata and actions */}
              <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="text-slate-400">Modified:</span>
                  <span className="font-medium text-slate-600">{formatDateShort(version.updatedAt)}</span>
                </div>
                
                {/* Secondary Actions - Compact */}
                <div className="flex items-center gap-0.5">
                  {version.isActive && isFormActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeactivate();
                      }}
                      disabled={deactivatingId !== null}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer"
                      title="Deactivate Form - Remove form from storefront"
                    >
                      {deactivatingId !== null ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PowerOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetActive(version.id);
                      }}
                      disabled={activatingId === version.id}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer"
                      title="Activate Form - Set this form as the active form"
                    >
                      {activatingId === version.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEdit(version, e)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Rename Form - Change the name of this form"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(version.id, e)}
                    className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Delete Form - Permanently remove this form"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
    <div className="space-y-3">
      {filteredVersions.map((version: any) => (
        <div
          key={version.id}
          className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
          onClick={(e) => handleFormClick(version, e)}
        >
          {/* Hover overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 rounded-xl transition-all duration-300 pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* Form Preview Thumbnail - Enhanced List View with better sizing */}
              {version.form && (
                <div className="relative border border-slate-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow bg-white" style={{ 
                  width: '180px', 
                  height: '140px',
                  minWidth: '180px',
                  minHeight: '140px'
                }}>
                  <div className="relative w-full h-full">
                    <FormPreviewThumbnail form={version.form} isCompact={true} />
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-base font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {version.name || 'Unnamed'}
                  </h3>
                  {version.isActive && isFormActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Modified:</span>
                    <span className="font-medium text-slate-600">{formatDateShort(version.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions - Always show activate/deactivate button */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {version.isActive && isFormActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate();
                  }}
                  disabled={deactivatingId !== null}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer"
                  title="Deactivate Form - Remove form from storefront"
                >
                  {deactivatingId !== null ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PowerOff className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(version.id);
                  }}
                  disabled={activatingId === version.id}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95 cursor-pointer"
                  title="Activate Form - Set this form as the active form"
                >
                  {activatingId === version.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => handleEdit(version, e)}
                className="p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                title="Rename Version - Change the name of this version"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(version.id, e)}
                className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                title="Delete Version - Permanently remove this version"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section - Matching Requests page style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold !text-white mb-2">Saved Forms</h1>
              <p className="text-slate-400 text-sm">Manage and activate your signup forms</p>
            </div>
          </div>
          
          {/* Search Bar and View Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group flex-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <div className="absolute left-4 z-10 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-300 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-16 py-3.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:bg-white/15 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Grid View - Display forms in a card grid layout"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white/20 text-white shadow-lg shadow-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="List View - Display forms in a compact list layout"
                aria-label="List view"
              >
                <ListChecks className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search Results Indicator */}
          {searchQuery && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-slate-300">
                Found <span className="font-semibold text-white">{filteredVersions.length}</span> of{' '}
                <span className="font-semibold text-white">{versions.length}</span> forms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="transition-all duration-300">
          {viewMode === 'grid' ? renderGridSkeleton() : renderListSkeleton()}
        </div>
      ) : filteredVersions.length === 0 ? (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-12 sm:p-16">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mb-6 shadow-sm">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {searchQuery ? 'No forms found' : 'No saved forms yet'}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all forms.' 
                : 'Create and save your first form to start managing and activating signup forms.'}
            </p>
            {!searchQuery && onNavigateToBuilder && (
              <button
                onClick={onNavigateToBuilder}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30"
              >
                Go to Builder
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="transition-all duration-300">
          {viewMode === 'grid' ? renderGridView() : renderListView()}
        </div>
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
        onDeactivate={handleDeactivate}
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
    </div>
  );
}

