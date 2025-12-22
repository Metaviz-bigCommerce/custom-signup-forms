'use client'

import React, { useState } from 'react';
import { useFormVersions, useFormVersionActions, useBcScriptsActions, useStoreFormActions, useStoreForm } from '@/lib/hooks';
import { Loader2, Trash2, CheckCircle2, FileEdit, Power, Pencil, Search, LayoutGrid, ListChecks, XCircle } from 'lucide-react';
import VersionNameModal from './VersionNameModal';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActivationConfirmModal from './ActivationConfirmModal';
import FormOperationProgressModal from './FormOperationProgressModal';
import DeleteConfirmModal from './DeleteConfirmModal';

// Form Preview Thumbnail Component - Compact preview showing just a small portion
const FormPreviewThumbnail: React.FC<{ form: any }> = ({ form }) => {
  const fields = form?.fields || [];
  const theme = form?.theme || {};
  
  const primaryColor = theme.primaryColor || '#2563eb';
  const title = theme.title || 'Create your account';
  const subtitle = theme.subtitle || 'Please fill in the form to continue';
  const buttonBg = theme.buttonBg || primaryColor;
  const buttonColor = theme.buttonColor || '#fff';
  const buttonRadius = theme.buttonRadius ?? 10;
  
  // Get first 2 fields for preview
  const previewFields = fields.slice(0, 2);
  
  return (
    <div style={{ 
      padding: '8px 12px',
      background: theme.background || '#ffffff',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      fontSize: '8px',
      lineHeight: '1.2'
    }}>
      {/* Title */}
      <div style={{ 
        fontSize: '10px', 
        fontWeight: '700', 
        color: '#0f172a', 
        marginBottom: '3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {title}
      </div>
      
      {/* Subtitle */}
      <div style={{ 
        fontSize: '7px', 
        color: '#64748b', 
        marginBottom: '6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {subtitle}
      </div>
      
      {/* Fields Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '4px' }}>
        {previewFields.map((field: any, idx: number) => {
          const borderColor = field.borderColor || '#e5e7eb';
          const borderRadius = field.borderRadius || '8';
          return (
            <div key={field.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ 
                fontSize: '6px', 
                color: field.labelColor || '#374151',
                fontWeight: '500'
              }}>
                {field.label || 'Field'}
              </div>
              <div style={{
                border: `0.5px solid ${borderColor}`,
                borderRadius: borderRadius + 'px',
                backgroundColor: field.type === 'password' 
                  ? 'repeating-linear-gradient(45deg, transparent, transparent 1px, #e5e7eb 1px, #e5e7eb 2px)'
                  : (field.bgColor || '#fff'),
                height: '8px',
                minHeight: '8px'
              }} />
            </div>
          );
        })}
      </div>
      
      {/* Button Preview */}
      <div style={{
        backgroundColor: buttonBg,
        borderRadius: buttonRadius + 'px',
        height: '10px',
        minHeight: '10px',
        marginTop: 'auto',
        width: '60%'
      }} />
    </div>
  );
};

type ViewMode = 'grid' | 'list';

interface VersionsListProps {
  onLoadVersion: (version: any) => void;
  onVersionLoaded?: () => void;
  onNavigateToBuilder?: () => void;
}

export default function VersionsList({ onLoadVersion, onVersionLoaded, onNavigateToBuilder }: VersionsListProps) {
  const { versions, mutate, isError } = useFormVersions();
  const { deleteVersion, setActiveVersion, updateVersion, deactivateAllVersions } = useFormVersionActions();
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { setActive } = useStoreFormActions();
  const { active: isFormActive, scriptUuid, mutate: mutateStoreForm } = useStoreForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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

  const filteredVersions = versions.filter((v: any) =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    // Don't show modal if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[onClick]')) {
      return;
    }
    setActivationModalVersion(version);
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
      const year = date.getFullYear().toString().slice(-2);

      return `${day}-${month}-${year}`;
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

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredVersions.map((version: any) => (
        <div
          key={version.id}
          className="bg-white border border-slate-200 rounded-xl p-[14px] hover:shadow-lg hover:border-blue-300 transition-all duration-200 group relative overflow-hidden"
        >
          {/* Active indicator bar */}
          {version.isActive && isFormActive && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
          )}
          
          <div className="flex flex-col h-full">
            {/* Form Preview Thumbnail */}
            {version.form && (
              <div className="mb-3 -mx-[14px] -mt-[14px] bg-slate-50 border-b border-slate-200 overflow-hidden rounded-t-xl" style={{ height: '140px', position: 'relative' }}>
                <div className="relative w-full h-full" style={{ overflow: 'hidden' }}>
                  <FormPreviewThumbnail form={version.form} />
                </div>
              </div>
            )}
            
            {/* Header - Name */}
            <div className="flex items-center gap-2">
              {version.isActive && isFormActive && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              )}
              <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {version.name || 'Unnamed'}
              </h3>
            </div>

            {/* Date modified and Actions - Single row */}
            <div className="flex items-center justify-between pt-2" onClick={(e) => e.stopPropagation()}>
              {/* Left side - Date modified */}
              <div className="text-xs text-gray-500">
                <span className="text-gray-400">Last modified:</span> {formatDateShort(version.updatedAt)}
              </div>
              
              {/* Right side - Load button and other buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleLoad(version)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Load into Builder - Open this version in the form builder"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  Load
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(version.id);
                  }}
                  disabled={activatingId === version.id}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                    version.isActive && isFormActive
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                  title={
                    version.isActive && isFormActive
                      ? 'Form is active - Click to deactivate'
                      : 'Activate Form - Set this form as the active form'
                  }
                >
                  {activatingId === version.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Power className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={(e) => handleEdit(version, e)}
                  className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Rename Form - Change the name of this form"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(version.id, e)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Form - Permanently remove this form"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredVersions.map((version: any) => (
        <div
          key={version.id}
          className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Active indicator */}
              {version.isActive && isFormActive && (
                <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-green-600 rounded-full flex-shrink-0" />
              )}
              
              {/* Form Preview Thumbnail - List View */}
              {version.form && (
                <div className="w-20 h-16 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0 shadow-sm" style={{ minWidth: '80px', position: 'relative' }}>
                  <div className="relative w-full h-full" style={{ overflow: 'hidden' }}>
                    <FormPreviewThumbnail form={version.form} />
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {version.name || 'Unnamed'}
                  </h3>
                  {version.isActive && isFormActive && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1.5 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Updated:</span>
                    <span className="font-medium">{formatDate(version.updatedAt)}</span>
                  </div>
                  {version.createdAt && version.createdAt !== version.updatedAt && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400">Created:</span>
                      <span className="font-medium">{formatDate(version.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleLoad(version)}
                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Load into Builder - Open this version in the form builder"
              >
                <FileEdit className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
              </button>
              {!version.isActive && !isFormActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(version.id);
                  }}
                  disabled={activatingId === version.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Activate Form - Set this form as the active form"
                >
                  {activatingId === version.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                </button>
              )}
              {isFormActive && version.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate();
                  }}
                  disabled={deactivatingId !== null}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Deactivate Form - Remove form from storefront"
                >
                  {deactivatingId !== null ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={(e) => handleEdit(version, e)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Rename Version - Change the name of this version"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(version.id, e)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    <div className="p-6">
      {/* Header with Search and View Toggle */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-slate-50'
              }`}
              title="Grid View - Display versions in a card grid layout"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-slate-50'
              }`}
              title="List View - Display versions in a compact list layout"
              aria-label="List view"
            >
              <ListChecks className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredVersions.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">
            {searchQuery ? 'No forms found matching your search.' : 'No saved forms yet.'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {searchQuery ? 'Try adjusting your search terms.' : 'Save your form to start managing and activating forms.'}
          </p>
          {!searchQuery && onNavigateToBuilder && (
            <button
              onClick={onNavigateToBuilder}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Go to Builder
            </button>
          )}
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

