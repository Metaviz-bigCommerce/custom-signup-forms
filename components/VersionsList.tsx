'use client'

import React, { useState } from 'react';
import { useFormVersions, useFormVersionActions, useBcScriptsActions, useStoreFormActions, useStoreForm } from '@/lib/hooks';
import { Loader2, Trash2, CheckCircle2, FileEdit, Power, Pencil, Search, LayoutGrid, ListChecks, XCircle } from 'lucide-react';
import VersionNameModal from './VersionNameModal';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ActivationConfirmModal from './ActivationConfirmModal';

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
  const { deleteVersion, setActiveVersion, updateVersion } = useFormVersionActions();
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { setActive } = useStoreFormActions();
  const { active: isFormActive, scriptUuid, mutate: mutateStoreForm } = useStoreForm();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [activationModalVersion, setActivationModalVersion] = useState<any | null>(null);
  const toast = useToast();

  const filteredVersions = versions.filter((v: any) =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Version',
      message: 'Are you sure you want to delete this version? This action cannot be undone.',
      onConfirm: async () => {
        setDeletingId(versionId);
        try {
          await deleteVersion(versionId);
          await mutate();
          toast.showSuccess('Version deleted successfully.');
        } catch (error: unknown) {
          toast.showError('Failed to delete version: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleSetActive = async (versionId: string, showConfirm: boolean = true) => {
    const version = versions.find((v: any) => v.id === versionId);
    if (!version) {
      toast.showError('Version not found');
      return;
    }

    // Prevent activation of drafts
    if (version.type === 'draft') {
      toast.showError('Draft forms cannot be activated. Please convert to a version first.');
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

  const performActivation = async (versionId: string) => {
    const version = versions.find((v: any) => v.id === versionId);
    if (!version || !version.form) {
      toast.showError('Version not found or has no form data');
      return;
    }

    setActivatingId(versionId);
    try {

      // Generate signup script using version's fields+theme
      await fetch('/api/generate-signup-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields: version.form.fields, theme: version.form.theme })
      });

      // Create or update BigCommerce script
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
          await updateScript(finalScriptUuid, scriptPayload);
        } else {
          const data = await addScript(scriptPayload);
          finalScriptUuid = (data as any)?.data?.uuid || null;
        }
      } catch (scriptError: any) {
        console.error('Script update error:', scriptError);
        // Continue even if script update fails - version activation should still work
      }

      // Set version as active (updates DB and main form)
      await setActiveVersion(versionId);
      
      // Set signupFormActive=true
      await setActive(true);
      
      // Refresh versions list first to get updated isActive flags
      await mutate();
      // Then refresh store form to get updated active state
      await mutateStoreForm();
      
      // Force a small delay to ensure state is fully updated
      setTimeout(() => {
        mutate();
        mutateStoreForm();
      }, 100);
      
      if (onVersionLoaded) onVersionLoaded();
      
      toast.showSuccess('Form activated' + (finalScriptUuid ? `: ${finalScriptUuid}` : '.'));
    } catch (error: any) {
      toast.showError('Failed to activate version: ' + (error?.message || 'Unknown error'));
    } finally {
      setActivatingId(null);
    }
  };

  const handleDeactivate = async () => {
    setDeactivatingId('deactivate');
    try {
      // Delete BigCommerce script if it exists
      if (scriptUuid) {
        try {
          await deleteScript(scriptUuid);
        } catch (scriptError: any) {
          console.error('Script deletion error:', scriptError);
          // Continue even if script deletion fails
        }
      }

      // Set signupFormActive=false
      await setActive(false);
      
      await mutate();
      await mutateStoreForm();
      
      // Force a small delay to ensure state is fully updated
      setTimeout(() => {
        mutate();
        mutateStoreForm();
      }, 100);
      
      if (onVersionLoaded) onVersionLoaded();
      
      toast.showSuccess('Form deactivated.');
    } catch (error: any) {
      toast.showError('Failed to deactivate: ' + (error?.message || 'Unknown error'));
    } finally {
      setDeactivatingId(null);
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
      toast.showError('Failed to update version name: ' + (error?.message || 'Unknown error'));
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

  const getTypeBadge = (type: string) => {
    const styles = {
      published: 'bg-green-100 text-green-700 border-green-300',
      draft: 'bg-amber-100 text-amber-700 border-amber-300',
      version: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load versions. Please try again.
      </div>
    );
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredVersions.map((version: any) => (
        <div
          key={version.id}
          className="bg-white border border-slate-200 rounded-xl p-[14px] hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          onClick={() => handleLoad(version)}
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
            
            {/* Header - Name and version badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ${getTypeBadge(version.type)}`}>
                {version.type || 'version'}
              </span>
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
                {/* Always show Activate button for versions (not drafts) */}
                {version.type !== 'draft' && (
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
                        : 'Activate Version - Set this version as the active form'
                    }
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
                  className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Rename Version - Change the name of this version"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDelete(version.id, e)}
                  disabled={deletingId === version.id}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Version - Permanently remove this version"
                >
                  {deletingId === version.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
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
          className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
          onClick={() => handleLoad(version)}
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
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex-shrink-0 ${getTypeBadge(version.type)}`}>
                    {version.type || 'version'}
                  </span>
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
            
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleLoad(version)}
                className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="Load into Builder - Open this version in the form builder"
              >
                <FileEdit className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
              </button>
              {!version.isActive && !isFormActive && version.type !== 'draft' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetActive(version.id);
                  }}
                  disabled={activatingId === version.id}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Activate Version - Set this version as the active form"
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
                disabled={deletingId === version.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Delete Version - Permanently remove this version"
              >
                {deletingId === version.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
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
              placeholder="Search versions..."
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
            {searchQuery ? 'Try adjusting your search terms.' : 'Save your form to start managing and activating versions.'}
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
        title="Rename Version"
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
    </div>
  );
}

