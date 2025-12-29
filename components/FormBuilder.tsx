'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FilePlus, Wrench, FileText } from 'lucide-react';
import { useBcScriptsActions, useStoreForm, useStoreFormActions, useFormVersionActions, useFormVersions } from '@/lib/hooks';
import Skeleton from '@/components/Skeleton';
import VersionsList from '@/components/VersionsList';
import LoadVersionConfirmModal from '@/components/LoadVersionConfirmModal';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import UnsavedChangesModal from '@/components/UnsavedChangesModal';
import SaveModal from '@/components/SaveModal';
import { FormField, FieldType } from './FormBuilder/types';
import { defaultTheme, normalizeThemeLayout, ensureCoreFields, normalizeFieldsForComparison } from './FormBuilder/utils';
import BuilderTab from './FormBuilder/BuilderTab';
import TopActionBar from './FormBuilder/TopActionBar';
import AddFieldPopup from './FormBuilder/AddFieldPopup';
import FieldEditorPopup from './FormBuilder/FieldEditorPopup';
import ThemeEditorPopup from './FormBuilder/ThemeEditorPopup';

const FormBuilder: React.FC = () => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showFieldEditor, setShowFieldEditor] = useState<boolean>(false);
  const [showAddFieldEditor, setShowAddFieldEditor] = useState<boolean>(false);
  const [pendingFieldType, setPendingFieldType] = useState<{ type: FieldType; role?: 'country' | 'state' } | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [draggedFieldId, setDraggedFieldId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Initialize activeTab from sessionStorage if returning from preview, otherwise default to 2 (Forms tab)
  const [activeTab, setActiveTab] = useState<number>(() => {
    try {
      const storedData = sessionStorage.getItem('previewFormData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.returnFromPreview && data.sourceTab) {
          return data.sourceTab;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    return 2; // Default to Forms tab
  });
  const [showLoadVersionConfirm, setShowLoadVersionConfirm] = useState<boolean>(false);
  const [pendingVersion, setPendingVersion] = useState<any>(null);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState<boolean>(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<number | null>(null);
  const [showSaveModalForTabSwitch, setShowSaveModalForTabSwitch] = useState<boolean>(false);
  const [currentFormName, setCurrentFormName] = useState<string>('Unnamed');
  const [currentFormVersionId, setCurrentFormVersionId] = useState<string | null>(null);
  const [activeVersionName, setActiveVersionName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmVariant?: 'danger' | 'primary' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  // Track last saved state for accurate dirty checking
  const [lastSavedState, setLastSavedState] = useState<{ fields: FormField[]; theme: any } | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
  const [hasInitializedForm, setHasInitializedForm] = useState<boolean>(false);
  const restoredFromPreviewRef = useRef<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(true); // Prevent flicker during restore
  const toast = useToast();
  const [theme, setTheme] = useState<any>(defaultTheme);
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { form, active, scriptUuid, mutate: mutateStoreForm, isError, isLoading } = useStoreForm();
  const { saveForm, setActive } = useStoreFormActions();
  const { saveAsVersion, updateVersion } = useFormVersionActions();
  const { versions, mutate: mutateVersions } = useFormVersions();

  // Persist form builder state to sessionStorage for preview restoration
  useEffect(() => {
    try {
      sessionStorage.setItem('formBuilderState', JSON.stringify({
        lastSavedState,
        isEditing,
        currentFormName,
        currentFormVersionId,
        hasInitializedForm
      }));
    } catch (error) {
      // Ignore storage errors
    }
  }, [lastSavedState, isEditing, currentFormName, currentFormVersionId, hasInitializedForm]);

  // Determine if form is new (no saved form exists or form hasn't been saved yet)
  // A form is considered "new" if it has been initialized but hasn't been saved (lastSavedState is null)
  const isNewForm = useMemo(() => {
    // If form has been initialized but not saved, it's a new form
    if (hasInitializedForm && formFields.length > 0 && lastSavedState === null) {
      return true;
    }
    // Otherwise, check if no saved form exists in DB
    return form === null && currentFormVersionId === null;
  }, [form, currentFormVersionId, hasInitializedForm, formFields.length, lastSavedState]);

  // Restore form state when returning from full screen preview
  // This must run BEFORE the form loading effect, so we use a ref for synchronous checking
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('previewFormData');
      let shouldRestore = false;
      
      if (storedData) {
        const data = JSON.parse(storedData);
        // Check if we're returning from preview
        if (data.returnFromPreview) {
          shouldRestore = true;
          // Mark immediately with ref (synchronous) so form loading effect can check it
          restoredFromPreviewRef.current = true;
          
          // Restore form state from preview - do all state updates in a single batch
          if (data.formFields && Array.isArray(data.formFields)) {
            setFormFields(data.formFields);
            // Restore lastSavedState from stored data if it exists, otherwise keep it null
            // This preserves the "unsaved changes" state for new forms
            if (data.lastSavedState !== undefined && data.lastSavedState !== null) {
              setLastSavedState(data.lastSavedState);
            } else {
              // If no lastSavedState was stored, it means the form was new/unsaved
              // Keep lastSavedState as null so isDirty will be true
              setLastSavedState(null);
            }
          }
          if (data.theme) {
            setTheme(data.theme);
          }
          if (data.viewMode) {
            setViewMode(data.viewMode);
          }
          // Active tab is already restored via useState lazy initialization, no need to set it again
          // Restore editing state
          if (data.isEditing !== undefined) {
            setIsEditing(data.isEditing);
          }
          // Always restore form name (even if it's "Unnamed" or empty string)
          if (data.currentFormName !== undefined) {
            setCurrentFormName(data.currentFormName);
          }
          if (data.currentFormVersionId !== undefined) {
            setCurrentFormVersionId(data.currentFormVersionId);
          }
          setHasInitializedForm(data.hasInitializedForm !== undefined ? data.hasInitializedForm : true);
          
          // Clear the return flag so it doesn't restore again
          const updatedData = { ...data };
          delete updatedData.returnFromPreview;
          sessionStorage.setItem('previewFormData', JSON.stringify(updatedData));
        }
      }
      
      // Mark restoration as complete
      if (!shouldRestore) {
        setIsRestoring(false);
      } else {
        // Use double requestAnimationFrame to ensure all state updates are batched and rendered together
        // This prevents flickering by waiting for the next paint cycle
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsRestoring(false);
          });
        });
      }
    } catch (error) {
      console.error('Failed to restore form state from preview:', error);
      setIsRestoring(false);
    }
  }, []); // Run only once on mount

  // Initialize form fields when form data is loaded
  // NOTE: This should NOT run when we have a currentFormVersionId because loadVersionData
  // already handles loading version-specific form data. This effect is only for the main store form.
  useEffect(() => {
    // Only process if form is not undefined (either null or an object)
    if (form === undefined) return; // Still loading
    
    // If we just restored from preview, don't overwrite the restored state
    // Use ref for synchronous check (state updates are async)
    if (restoredFromPreviewRef.current) {
      return; // Keep the restored state from preview
    }
    
    // CRITICAL: If we have a currentFormVersionId, we're loading from a version.
    // Don't overwrite the version data with the store form data.
    // The version data is loaded via loadVersionData() which sets the fields directly.
    if (currentFormVersionId) {
      return; // Don't overwrite version data with store form data
    }
    
    // Only load form data if we're editing an existing form
    // Otherwise, always show default state
    if (isEditing && form && form.fields && Array.isArray(form.fields) && form.fields.length > 0) {
      // Ensure the 4 core fields exist in any loaded form
      const loadedFields = ensureCoreFields((form.fields as any) || []);
      setFormFields(loadedFields);
      setHasInitializedForm(true);
      // Update last saved state
      // Merge with defaultTheme, but don't include formBackgroundColor unless it was explicitly saved
      const savedTheme = form.theme as any || {};
      const mergedThemeForState = { 
        ...defaultTheme, 
        ...savedTheme
      };
      // Remove formBackgroundColor if it wasn't in the saved theme (user didn't set it)
      if (!savedTheme.hasOwnProperty('formBackgroundColor')) {
        delete mergedThemeForState.formBackgroundColor;
      }
      const loadedTheme = normalizeThemeLayout(mergedThemeForState);
      setLastSavedState({ fields: loadedFields, theme: loadedTheme });
      
      if (form?.theme) {
        const savedThemeData = form.theme as any;
        const mergedTheme = { 
          ...defaultTheme, 
          ...savedThemeData
        };
        // Remove formBackgroundColor if it wasn't in the saved theme
        if (!savedThemeData.hasOwnProperty('formBackgroundColor')) {
          delete mergedTheme.formBackgroundColor;
        }
        // Normalize layout when loading from saved form
        setTheme(normalizeThemeLayout(mergedTheme));
      }
    } else {
      // Not editing - show empty state if form hasn't been initialized
      // BUT: if we restored from preview, don't reset the state
      if (restoredFromPreviewRef.current) {
        return; // Keep the restored state from preview
      }
      
      if (!hasInitializedForm) {
        setFormFields([]);
        setTheme(defaultTheme);
        setLastSavedState(null);
      } else {
        // Form has been initialized, show default fields
        const defaultFields = ensureCoreFields([]);
        setFormFields(defaultFields);
        setTheme(defaultTheme);
        setLastSavedState(null);
      }
    }
    // Note: restoredFromPreview is intentionally not in the dependency array
    // It's set in a separate effect that runs once on mount, and we only check it
    // at the start of this effect to skip loading if we restored from preview
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isEditing, currentFormVersionId, hasInitializedForm]);

  // Check if current form matches any saved version to get its name
  // Skip this if we restored from preview (to preserve the restored name)
  useEffect(() => {
    // Don't overwrite form name if we restored from preview
    if (restoredFromPreviewRef.current) {
      return;
    }
    if (!form || !versions?.length) {
      // If no form or versions, check if we have a current version ID
      if (!currentFormVersionId) {
        setCurrentFormName('Unnamed');
      }
      return;
    }

    // Try to find a matching version by comparing form data
    const formDataStr = JSON.stringify({ fields: form.fields, theme: form.theme });
    const matchingVersion = versions.find((v: any) => {
      if (!v.form) return false;
      const versionDataStr = JSON.stringify({ fields: v.form.fields, theme: v.form.theme });
      return versionDataStr === formDataStr;
    });

    if (matchingVersion) {
      setCurrentFormName(matchingVersion.name || 'Unnamed');
      setCurrentFormVersionId(matchingVersion.id);
    } else if (!currentFormVersionId) {
      // Only set to Unnamed if we don't have a tracked version ID
      setCurrentFormName('Unnamed');
    }
  }, [form, versions, currentFormVersionId]);

  // Get active version name for display
  useEffect(() => {
    console.log('[FormBuilder] Updating activeVersionName', { active, versionsCount: versions?.length, activeVersionName });
    if (active && versions?.length) {
      const activeVersion = versions.find((v: any) => v.isActive);
      if (activeVersion) {
        const newName = activeVersion.name || 'Unnamed';
        console.log('[FormBuilder] Found active version:', { name: newName, id: activeVersion.id });
        setActiveVersionName(newName);
      } else {
        // If active is true but no version is marked as active, try to find by matching form data
        if (form) {
          const formDataStr = JSON.stringify({ fields: form.fields, theme: form.theme });
          const matchingVersion = versions.find((v: any) => {
            if (!v.form) return false;
            const versionDataStr = JSON.stringify({ fields: v.form.fields, theme: v.form.theme });
            return versionDataStr === formDataStr;
          });
          if (matchingVersion) {
            const newName = matchingVersion.name || 'Unnamed';
            console.log('[FormBuilder] Found matching version by form data:', { name: newName, id: matchingVersion.id });
            setActiveVersionName(newName);
          } else {
            console.log('[FormBuilder] No matching version found, setting activeVersionName to null');
            setActiveVersionName(null);
          }
        } else {
          console.log('[FormBuilder] No form data, setting activeVersionName to null');
          setActiveVersionName(null);
        }
      }
    } else {
      // Explicitly clear activeVersionName when not active
      console.log('[FormBuilder] Form not active or no versions, setting activeVersionName to null', { active, hasVersions: !!versions?.length });
      setActiveVersionName(null);
    }
  }, [active, versions, form]);

  // Helper function to normalize fields for comparison (remove IDs for comparison)

  const isDirty = useMemo(() => {
    try {
      // If form hasn't been initialized yet (empty state), it's not dirty
      if (!hasInitializedForm && formFields.length === 0) {
        return false;
      }

      // If no saved state exists, check if current state differs from defaults
      if (!lastSavedState) {
        // If formFields is empty, it's not dirty (user hasn't created form yet)
        if (formFields.length === 0) {
          return false;
        }
        // If form has been initialized but not saved, it's considered dirty (saveable)
        // This allows saving a new form even if it matches defaults
        if (hasInitializedForm && formFields.length > 0) {
          return true;
        }
        const defaultFields = ensureCoreFields([]);
        const currentFieldsNormalized = normalizeFieldsForComparison(formFields);
        const defaultFieldsNormalized = normalizeFieldsForComparison(defaultFields);
        const fieldsChanged = JSON.stringify(defaultFieldsNormalized) !== JSON.stringify(currentFieldsNormalized);
        const themeChanged = JSON.stringify(defaultTheme) !== JSON.stringify(normalizeThemeLayout(theme));
        return fieldsChanged || themeChanged;
      }

      // Compare against last saved state
      const savedFieldsNormalized = normalizeFieldsForComparison(lastSavedState.fields);
      const currentFieldsNormalized = normalizeFieldsForComparison(formFields);
      const fieldsChanged = JSON.stringify(savedFieldsNormalized) !== JSON.stringify(currentFieldsNormalized);
      const themeChanged = JSON.stringify(normalizeThemeLayout(lastSavedState.theme)) !== JSON.stringify(normalizeThemeLayout(theme));
      
      return fieldsChanged || themeChanged;
    } catch {
      // On error, assume dirty to be safe
      return true;
    }
  }, [lastSavedState, formFields, theme, hasInitializedForm]);

  const handleReset = () => {
    // Clear all form fields - reset to empty state
    setFormFields([]);
    
    // Reset theme to defaults
    const defaultThemeCopy = { ...defaultTheme };
    setTheme(defaultThemeCopy);
    
    // Update last saved state to null (form is reset, not saved)
    setLastSavedState(null);
    
    // Reset form name and version ID
    setCurrentFormName('Unnamed');
    setCurrentFormVersionId(null);
    
    // Reset editing flag and initialization flag
    setIsEditing(false);
    setHasInitializedForm(false);
    
    // Close any open popups
    setShowFieldEditor(false);
    setShowAddFieldEditor(false);
    setPendingFieldType(null);
    setShowThemeEditor(false);
    setSelectedField(null);
    setShowResetConfirm(false);
  };

  const addField = (type: FieldType) => {
    // Open Add Field popup instead of immediately adding
    setPendingFieldType({ type });
    setShowAddFieldEditor(true);
  };

  const addAddressField = (role: 'country' | 'state') => {
    // Open Add Field popup instead of immediately adding
    setPendingFieldType({ type: 'select', role });
    setShowAddFieldEditor(true);
  };

  async function addSignupFormScript() {
    const payload = {
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
    const data = await addScript(payload);
    console.log('addScript data:', data);
    return data;
  }

  async function handleSaveForm() {
    setIsSaving(true);
    try {
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      await saveForm({ fields: withCore, theme: normalizedTheme });
      
      // If current form matches a version, update that version's timestamp
      if (currentFormVersionId) {
        try {
          await updateVersion(currentFormVersionId, { form: { fields: withCore, theme: normalizedTheme } });
          await mutateVersions();
        } catch (e) {
          // Silently fail - version update is not critical
          console.error('Failed to update version timestamp:', e);
        }
      }
      
      // If a script exists, regenerate JS and update the script
      if (active && scriptUuid) {
        await fetch('/api/generate-signup-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formFields: withCore, theme: normalizedTheme })
        });
        await updateScript(scriptUuid, {
          name: "Custom Signup Form",
          description: "Updated custom signup form script",
          src: typeof window !== 'undefined' ? `${window.location.origin}/custom-signup.min.js` : "/custom-signup.min.js",
          auto_uninstall: true,
          load_method: "default",
          location: "head",
          visibility: "all_pages",
          kind: "src",
          consent_category: "essential"
        });
      }
      // Update last saved state
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      // When saving main form, check if it matches any version to update name
      await mutateStoreForm();
      // Mark as editing since form is now saved
      setIsEditing(true);
      setHasInitializedForm(true);
      // The useEffect will automatically update the name if it matches a version
      toast.showSuccess('Form saved.');
    } catch (e: unknown) {
      toast.showError('Failed to save form: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveToExisting(name: string) {
    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.showWarning('Name is required');
        setIsSaving(false);
        return;
      }
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      
      // For new forms, save as a version first with the name
      if (isNewForm) {
        const result = await saveAsVersion(trimmedName, 'version', { fields: withCore, theme: normalizedTheme });
        
        // Update form name and version ID
        if (result?.id) {
          setCurrentFormName(trimmedName);
          setCurrentFormVersionId(result.id);
        }
        
        // Also save to main form
        await saveForm({ fields: withCore, theme: normalizedTheme });
      } else {
        // For existing forms, save to main form
        await saveForm({ fields: withCore, theme: normalizedTheme });
        
        // If we have a version ID, update that version too
        if (currentFormVersionId) {
          try {
            await updateVersion(currentFormVersionId, { 
              name: trimmedName, 
              form: { fields: withCore, theme: normalizedTheme } 
            });
            await mutateVersions();
          } catch (e) {
            // Silently fail - version update is not critical
            console.error('Failed to update version:', e);
          }
        }
        
        // Update form name
        setCurrentFormName(trimmedName);
      }
      
      // Update last saved state
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      if (isNewForm) {
        await mutateVersions(); // Refresh versions list for new forms
      }
      setIsEditing(true);
      setHasInitializedForm(true);
      
      // If a script exists, regenerate JS and update the script
      if (active && scriptUuid) {
        await fetch('/api/generate-signup-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formFields: withCore, theme: normalizedTheme })
        });
        await updateScript(scriptUuid, {
          name: "Custom Signup Form",
          description: "Updated custom signup form script",
          src: typeof window !== 'undefined' ? `${window.location.origin}/custom-signup.min.js` : "/custom-signup.min.js",
          auto_uninstall: true,
          load_method: "default",
          location: "head",
          visibility: "all_pages",
          kind: "src",
          consent_category: "essential"
        });
      }
      
      toast.showSuccess('Form saved.');
      
      // Switch to Forms tab first, then clear builder state after a brief delay
      // This prevents form preview from briefly showing default theme colors
      setActiveTab(2);
      // Use setTimeout to clear state after tab switch is complete
      setTimeout(() => {
        clearBuilderState();
      }, 0);
    } catch (e: unknown) {
      toast.showError('Failed to save form: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsNew(name: string) {
    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.showWarning('Name is required');
        setIsSaving(false);
        return;
      }
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      
      // Save as a new version
      const result = await saveAsVersion(trimmedName, 'version', { fields: withCore, theme: normalizedTheme });
      
      // Update form name and version ID
      if (result?.id) {
        setCurrentFormName(trimmedName);
        setCurrentFormVersionId(result.id);
      }
      
      // Update last saved state
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      setIsEditing(true);
      setHasInitializedForm(true);
      await mutateVersions();
      toast.showSuccess('Form saved as new.');
      
      // Switch to Forms tab first, then clear builder state after a brief delay
      // This prevents form preview from briefly showing default theme colors
      setActiveTab(2);
      // Use setTimeout to clear state after tab switch is complete
      setTimeout(() => {
        clearBuilderState();
      }, 0);
    } catch (e: unknown) {
      toast.showError('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardChanges() {
    if (!lastSavedState) {
      // If no saved state, reset to empty state
      setFormFields([]);
      setTheme(defaultTheme);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
      setIsEditing(false);
      setHasInitializedForm(false);
      toast.showSuccess('Changes discarded.');
      return;
    }
    // Restore from last saved state
    setFormFields([...lastSavedState.fields]);
    setTheme({ ...lastSavedState.theme });
    toast.showSuccess('Changes discarded.');
  }

  function handleCreateNewForm() {
    if (isDirty && hasInitializedForm) {
      setConfirmDialog({
        isOpen: true,
        title: 'Create New Form',
        message: 'You have unsaved changes. These will be discarded if you create a new form. You can save your current form first, or discard changes to create a new form.',
        onConfirm: async () => {
          // Discard and create new
          const defaultFields = ensureCoreFields([]);
          setFormFields(defaultFields);
          setTheme(defaultTheme);
          setCurrentFormName('Unnamed');
          setCurrentFormVersionId(null);
          setLastSavedState(null);
          setIsEditing(false);
          setHasInitializedForm(true);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          toast.showSuccess('New form created.');
        },
        confirmVariant: 'danger'
      });
    } else {
      // No changes, just create new
      const defaultFields = ensureCoreFields([]);
      setFormFields(defaultFields);
      setTheme(defaultTheme);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
      setLastSavedState(null);
      setIsEditing(false); // Set to false initially, will be set to true when user saves
      setHasInitializedForm(true);
      toast.showSuccess('New form created.');
    }
    // Switch to Builder tab if not already there
    if (activeTab !== 1) {
      setActiveTab(1);
    }
  }

  function handleLoadVersion(version: any) {
    if (isDirty) {
      // Show confirmation modal if there are unsaved changes
      setPendingVersion(version);
      setShowLoadVersionConfirm(true);
      return;
    }
    // Load version directly if no unsaved changes, and always switch to Builder tab
    loadVersionData(version, true);
  }

  function loadVersionData(version: any, goToBuilder: boolean = false) {
    // Close any open popups/editors before loading new data
    setShowFieldEditor(false);
    setShowAddFieldEditor(false);
    setPendingFieldType(null);
    setShowThemeEditor(false);
    setSelectedField(null);
    
    const originalFields = version?.form?.fields || [];
    const loadedFields = originalFields.length > 0 ? ensureCoreFields(originalFields) : ensureCoreFields([]);
    let loadedTheme;
    if (version?.form?.theme) {
      const savedThemeData = version.form.theme;
      const mergedTheme = { 
        ...defaultTheme, 
        ...savedThemeData
      };
      // Remove formBackgroundColor if it wasn't in the saved theme (user didn't set it)
      if (!savedThemeData.hasOwnProperty('formBackgroundColor')) {
        delete mergedTheme.formBackgroundColor;
      }
      loadedTheme = normalizeThemeLayout(mergedTheme);
    } else {
      loadedTheme = defaultTheme;
    }
    
    // Clear current form state and load new data
    setFormFields(loadedFields);
    setTheme(loadedTheme);
    
    // Update last saved state
    setLastSavedState({ fields: loadedFields, theme: loadedTheme });
    
    // Update form name and version ID
    setCurrentFormName(version?.name || 'Unnamed');
    setCurrentFormVersionId(version?.id || null);
    
    // Set isEditing flag: true if loading an existing form (has version ID), false if creating new
    setIsEditing(!!version?.id);
    
    // Mark form as initialized when loading a version
    setHasInitializedForm(true);
    
    // Switch to Builder tab if requested
    if (goToBuilder) {
      setActiveTab(1);
    }
    
    setShowLoadVersionConfirm(false);
    setPendingVersion(null);
  }

  function handleConfirmLoadVersion() {
    if (pendingVersion) {
      // Always switch to Builder when loading from confirmation
      loadVersionData(pendingVersion, true);
    }
  }

  function handleConfirmLoadAndGoToBuilder() {
    if (pendingVersion) {
      loadVersionData(pendingVersion, true);
    }
  }

  async function handleSaveAndLoadVersion() {
    if (!pendingVersion) return;
    // Save current form first
    await handleSaveForm();
    // Then load the version and switch to Builder tab
    loadVersionData(pendingVersion, true);
  }

  // Helper function to clear builder state
  function clearBuilderState() {
    setFormFields([]);
    setTheme(defaultTheme);
    setLastSavedState(null);
    setCurrentFormName('Unnamed');
    setCurrentFormVersionId(null);
    setHasInitializedForm(false);
    setIsEditing(false);
    setSelectedField(null);
    // Close any open popups/editors
    setShowFieldEditor(false);
    setShowAddFieldEditor(false);
    setPendingFieldType(null);
    setShowThemeEditor(false);
    setEditingName('');
    setIsEditingName(false);
  }

  function handleTabSwitch(newTab: number) {
    // Only show unsaved changes modal if form has been initialized and has changes
    if (isDirty && hasInitializedForm && formFields.length > 0 && activeTab !== newTab) {
      setPendingTabSwitch(newTab);
      setShowUnsavedChangesModal(true);
    } else {
      // When switching to Forms tab (tab 2), always clear builder state
      if (newTab === 2) {
        clearBuilderState();
      }
      
      setActiveTab(newTab);
      
      // When switching to Builder tab and not editing, reset to empty state
      if (newTab === 1 && !isEditing && !hasInitializedForm) {
        clearBuilderState();
      }
    }
  }

  // Handler to show SaveModal when "Save & switch" is clicked
  function handleShowSaveForTabSwitch() {
    if (pendingTabSwitch === null) return;
    // Close the unsaved changes modal and show SaveModal
    setShowUnsavedChangesModal(false);
    setShowSaveModalForTabSwitch(true);
  }

  // Handler to save and switch tabs - uses the same logic as saving an existing form
  async function handleSaveAndSwitchTab(name: string) {
    if (pendingTabSwitch === null) return;
    
    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.showWarning('Name is required');
        setIsSaving(false);
        return;
      }
      
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      
      // For new forms, save as a version first with the name
      if (isNewForm) {
        const result = await saveAsVersion(trimmedName, 'version', { fields: withCore, theme: normalizedTheme });
        
        // Update form name and version ID
        if (result?.id) {
          setCurrentFormName(trimmedName);
          setCurrentFormVersionId(result.id);
        }
        
        // Also save to main form
        await saveForm({ fields: withCore, theme: normalizedTheme });
      } else {
        // For existing forms, save to main form
        await saveForm({ fields: withCore, theme: normalizedTheme });
        
        // If we have a version ID, update that version too
        if (currentFormVersionId) {
          try {
            await updateVersion(currentFormVersionId, { 
              name: trimmedName, 
              form: { fields: withCore, theme: normalizedTheme } 
            });
            await mutateVersions();
          } catch (e) {
            // Silently fail - version update is not critical
            console.error('Failed to update version:', e);
          }
        }
        
        // Update form name
        setCurrentFormName(trimmedName);
      }
      
      // Update last saved state (this marks the form as no longer dirty)
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      if (isNewForm) {
        await mutateVersions(); // Refresh versions list for new forms
      }
      setIsEditing(true);
      setHasInitializedForm(true);
      
      // If a script exists, regenerate JS and update the script
      if (active && scriptUuid) {
        await fetch('/api/generate-signup-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formFields: withCore, theme: normalizedTheme })
        });
        await updateScript(scriptUuid, {
          name: "Custom Signup Form",
          description: "Updated custom signup form script",
          src: typeof window !== 'undefined' ? `${window.location.origin}/custom-signup.min.js` : "/custom-signup.min.js",
          auto_uninstall: true,
          load_method: "default",
          location: "head",
          visibility: "all_pages",
          kind: "src",
          consent_category: "essential"
        });
      }
      
      toast.showSuccess('Form saved.');
      
      // Switch to target tab after save completes
      const targetTab = pendingTabSwitch;
      setPendingTabSwitch(null);
      
      setActiveTab(targetTab);
      
      // If switching to Forms tab (tab 2), clear builder state after tab switch
      // This prevents form preview from briefly showing default theme colors
      if (targetTab === 2) {
        setTimeout(() => {
          clearBuilderState();
        }, 0);
      }
    } catch (e: unknown) {
      toast.showError('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  // Handler to save as new and switch tabs - uses the same logic as handleSaveAsNew
  async function handleSaveAsNewAndSwitchTab(name: string) {
    if (pendingTabSwitch === null) return;
    
    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        toast.showWarning('Name is required');
        setIsSaving(false);
        return;
      }
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      
      // Save as a new version (same logic as handleSaveAsNew)
      const result = await saveAsVersion(trimmedName, 'version', { fields: withCore, theme: normalizedTheme });
      
      // Update form name and version ID
      if (result?.id) {
        setCurrentFormName(trimmedName);
        setCurrentFormVersionId(result.id);
      }
      
      // Update last saved state
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      setIsEditing(true);
      setHasInitializedForm(true);
      await mutateVersions();
      toast.showSuccess('Form saved as new.');
      
      // Switch to target tab after save completes
      const targetTab = pendingTabSwitch;
      setPendingTabSwitch(null);
      
      setActiveTab(targetTab);
      
      // If switching to Forms tab (tab 2), clear builder state after tab switch
      // This prevents form preview from briefly showing default theme colors
      if (targetTab === 2) {
        setTimeout(() => {
          clearBuilderState();
        }, 0);
      }
    } catch (e: unknown) {
      toast.showError('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardAndSwitchTab() {
    if (pendingTabSwitch === null) return;
    
    // Clear any pending state
    const targetTab = pendingTabSwitch;
    setPendingTabSwitch(null);
    setShowUnsavedChangesModal(false);
    
    // If switching to Forms tab (tab 2), always clear builder state after tab switch
    // This prevents form preview from briefly showing default theme colors
    if (targetTab === 2) {
      setActiveTab(targetTab);
      setTimeout(() => {
        clearBuilderState();
      }, 0);
    } else {
      // Fully discard all unsaved changes and reset to clean state
      if (!lastSavedState) {
        // If no saved state, reset to defaults
        setFormFields(ensureCoreFields([]));
        setTheme(defaultTheme);
        setCurrentFormName('Unnamed');
        setCurrentFormVersionId(null);
        setLastSavedState(null);
        setIsEditing(false);
        setHasInitializedForm(false);
      } else {
        // Restore from last saved state only if we're editing
        // Otherwise, reset to default state
        if (isEditing) {
          setFormFields([...lastSavedState.fields]);
          setTheme({ ...lastSavedState.theme });
        } else {
          setFormFields(ensureCoreFields([]));
          setTheme(defaultTheme);
          setLastSavedState(null);
          setHasInitializedForm(false);
        }
      }
      
      // If switching to Builder tab and not editing, ensure default state
      if (targetTab === 1 && !isEditing) {
        setFormFields([]);
        setTheme(defaultTheme);
        setLastSavedState(null);
        setHasInitializedForm(false);
        setCurrentFormName('Unnamed');
        setCurrentFormVersionId(null);
      }
    }
    
    // Switch to target tab
    setActiveTab(targetTab);
    toast.showSuccess('Changes discarded.');
  }

  async function handleSaveName() {
    if (!editingName.trim()) {
      toast.showWarning('Name cannot be empty');
      return;
    }

    const trimmedName = editingName.trim();
    const previousName = currentFormName;
    
    // Optimistically update UI immediately for instant feedback
    setCurrentFormName(trimmedName);
    setIsEditingName(false);
    setEditingName('');

    // Save in background (non-blocking)
    try {
      // If we have a version ID, update that version
      if (currentFormVersionId) {
        updateVersion(currentFormVersionId, { name: trimmedName })
          .then(() => {
            mutateVersions().catch(() => {}); // Silently fail mutate
          })
          .catch((e: any) => {
            // Revert on error
            setCurrentFormName(previousName);
            toast.showError('Failed to save name: ' + (e instanceof Error ? e.message : 'Unknown error'));
          });
      } else {
        // If it's unnamed and no version ID exists, just update the name in state
        // Don't create a new form here - let the user explicitly save via "Save"
        // This prevents duplicate forms from being created
        // The name will be saved when user clicks "Save"
        mutateVersions().catch(() => {}); // Silently fail mutate
      }
    } catch (e: any) {
      // Revert on error
      setCurrentFormName(previousName);
      toast.showError('Failed to save name: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }

  // Activate/Deactivate moved to Versions tab - these functions kept for reference but not used in Builder

  // Show skeleton only while loading (form is undefined and not an error)
  // If form is null, it means no form exists yet, so we'll initialize with defaults in useEffect
  if ((form === undefined || isLoading) && !isError) {
    return (
      <div className="grid grid-cols-12 gap-6 h-full">
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border-2 border-gray-100">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-9">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load form data</p>
          <button
            onClick={() => mutateStoreForm()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const deleteField = (id: number) => {
    const f = formFields.find(ff => ff.id === id);
    if (f?.locked || (f?.role && ['first_name','last_name','email','password'].includes(f.role))) {
      toast.showWarning('This field is required and cannot be removed.');
      return;
    }
    // If field is paired, unpair its partner
    if (f?.rowGroup != null) {
      const partner = formFields.find(ff => ff.id !== id && ff.rowGroup === f.rowGroup);
      if (partner) {
        setFormFields(formFields.map(ff => 
          ff.id === partner.id ? { ...ff, rowGroup: null } : ff
        ).filter(ff => ff.id !== id));
      } else {
        setFormFields(formFields.filter(ff => ff.id !== id));
      }
    } else {
      setFormFields(formFields.filter(ff => ff.id !== id));
    }
    if (selectedField?.id === id) {
      setSelectedField(null);
      setShowFieldEditor(false);
    }
  };

  const togglePairWithNext = (fieldId: number) => {
    const fieldIndex = formFields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1 || fieldIndex === formFields.length - 1) return; // Can't pair if it's the last field
    
    const field = formFields[fieldIndex];
    const nextField = formFields[fieldIndex + 1];
    
    // If already paired, unpair both
    if (field.rowGroup != null && nextField.rowGroup === field.rowGroup) {
      setFormFields(formFields.map(f => 
        f.id === fieldId || f.id === nextField.id 
          ? { ...f, rowGroup: null }
          : f
      ));
    } else {
      // Create new pair - generate unique group ID
      const newGroupId = Date.now();
      setFormFields(formFields.map(f => {
        if (f.id === fieldId || f.id === nextField.id) {
          return { ...f, rowGroup: newGroupId };
        }
        // If nextField was already in a pair, unpair its old partner
        if (f.rowGroup === nextField.rowGroup && f.id !== nextField.id) {
          return { ...f, rowGroup: null };
        }
        return f;
      }));
    }
  };

  const unpairField = (fieldId: number) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field || field.rowGroup == null) return;
    
    const groupId = field.rowGroup;
    setFormFields(formFields.map(f => 
      f.rowGroup === groupId ? { ...f, rowGroup: null } : f
    ));
  };

  const handleDragStart = (e: React.DragEvent, fieldId: number) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(fieldId));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedFieldId === null) return;
    
    const draggedIndex = formFields.findIndex(f => f.id === draggedFieldId);
    if (draggedIndex === -1) {
      setDraggedFieldId(null);
      return;
    }

    // Get the dragged field and check if it's paired
    const draggedField = formFields[draggedIndex];
    const isPaired = draggedField.rowGroup != null;
    
    // If paired, we need to move both fields together
    if (isPaired) {
      const partnerIndex = formFields.findIndex(f => 
        f.id !== draggedFieldId && f.rowGroup === draggedField.rowGroup
      );
      
      if (partnerIndex === -1) {
        // Partner not found, just move the single field
        const newFields = [...formFields];
        const [removed] = newFields.splice(draggedIndex, 1);
        // Adjust drop index if dragging from before the drop position
        const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
        newFields.splice(adjustedDropIndex, 0, removed);
        setFormFields(newFields);
      } else {
        // Move both fields together - keep them adjacent
        const newFields = [...formFields];
        const indices = [draggedIndex, partnerIndex].sort((a, b) => a - b);
        const [firstIdx, secondIdx] = indices;
        
        // Get both fields
        const field1 = newFields[firstIdx];
        const field2 = newFields[secondIdx];
        
        // Remove both fields (remove from higher index first to maintain indices)
        newFields.splice(secondIdx, 1);
        newFields.splice(firstIdx, 1);
        
        // Calculate adjusted drop index
        let adjustedDropIndex = dropIndex;
        if (dropIndex > secondIdx) {
          adjustedDropIndex = dropIndex - 2;
        } else if (dropIndex > firstIdx) {
          adjustedDropIndex = dropIndex - 1;
        }
        
        // Ensure adjusted index is not negative
        adjustedDropIndex = Math.max(0, adjustedDropIndex);
        
        // Insert both fields at new position, maintaining their relative order
        // Determine which field should come first based on original order
        if (draggedIndex < partnerIndex) {
          newFields.splice(adjustedDropIndex, 0, field1, field2);
        } else {
          newFields.splice(adjustedDropIndex, 0, field2, field1);
        }
        
        setFormFields(newFields);
      }
    } else {
      // Single field, just reorder
      const newFields = [...formFields];
      const [removed] = newFields.splice(draggedIndex, 1);
      // Adjust drop index if dragging from before the drop position
      const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newFields.splice(adjustedDropIndex, 0, removed);
      setFormFields(newFields);
    }
    
    setDraggedFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    setDragOverIndex(null);
  };

  const handleFieldClick = (field: FormField) => {
    setSelectedField(field);
    setShowFieldEditor(true);
  };

  const updateField = (id: number, updates: Partial<FormField> | FormField) => {
    const updatedFields = formFields.map(f => f.id === id ? { ...f, ...updates } : f);
    setFormFields(updatedFields);
    // Update selectedField if it matches the updated field
    if (selectedField?.id === id) {
      const updatedField = updatedFields.find(f => f.id === id);
      if (updatedField) {
        setSelectedField(updatedField);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Modern Tabs Headers - Always on top */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => handleTabSwitch(1)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 rounded-xl focus:outline-none group ${
              activeTab === 1
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <Wrench className={`w-4 h-4 transition-all duration-300 relative z-10 ${
              activeTab === 1 
                ? "text-white" 
                : "text-slate-600 group-hover:text-slate-800"
            } ${activeTab === 1 ? "scale-110" : "group-hover:scale-110"}`} />
            <span className="relative z-10">Builder</span>
          </button>
          <button
            onClick={() => handleTabSwitch(2)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-300 rounded-xl focus:outline-none group ${
              activeTab === 2
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/80"
            }`}
          >
            <FileText className={`w-4 h-4 transition-all duration-300 relative z-10 ${
              activeTab === 2 
                ? "text-white" 
                : "text-slate-600 group-hover:text-slate-800"
            } ${activeTab === 2 ? "scale-110" : "group-hover:scale-110"}`} />
            <span className="relative z-10">Forms</span>
          </button>
        </div>
        
        {/* Global Actions - Top Right */}
        <div className="flex items-center gap-3">
          {/* New Form Button - Only show in Forms tab, not Builder tab */}
          {activeTab !== 1 && (
            <button
              onClick={handleCreateNewForm}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
              title="Create a new form"
            >
              <FilePlus className="w-4 h-4" />
              <span>New Form</span>
            </button>
          )}

          {/* Active Form Indicator */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 ${
              active 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
            onClick={() => {
              if (activeTab !== 2) {
                handleTabSwitch(2);
              }
            }}
            title={active ? 'Activated form - Click to view in Forms' : 'No form activated - Click to view in Forms'}
          >
            {active ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Activated Form:</span>
                <span className="font-semibold">{activeVersionName || 'Unknown'}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span>No form is currently activate</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Action Bar - Only show in Builder tab when form has fields and not restoring */}
      {activeTab === 1 && formFields.length > 0 && !isRestoring && (
        <TopActionBar
          currentFormName={currentFormName}
          isEditingName={isEditingName}
          editingName={editingName}
          isDirty={isDirty}
          isSaving={isSaving}
          onNameChange={setEditingName}
          onStartEditing={() => {
            setEditingName(currentFormName);
            setIsEditingName(true);
          }}
          onSaveName={handleSaveName}
          onCancelEditing={() => {
            setIsEditingName(false);
            setEditingName('');
          }}
          onReset={() => {}} // Reset button removed - using discard instead
          onDiscard={() => {
            setConfirmDialog({
              isOpen: true,
              title: 'Discard Changes',
              message: 'Are you sure you want to discard all unsaved changes? This action cannot be undone.',
              onConfirm: () => {
                handleDiscardChanges();
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
              },
              confirmVariant: 'danger'
            });
          }}
          isNewForm={isNewForm}
          onSaveToExisting={handleSaveToExisting}
          onSaveAsNew={handleSaveAsNew}
        />
      )}

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 1 ? (
          <BuilderTab
            formFields={formFields}
            theme={theme}
            selectedField={selectedField}
            draggedFieldId={draggedFieldId}
            dragOverIndex={dragOverIndex}
            sidebarOpen={sidebarOpen}
            viewMode={viewMode}
            onSidebarToggle={setSidebarOpen}
            onAddField={addField}
            onAddAddressField={addAddressField}
            onFieldClick={handleFieldClick}
            onDeleteField={deleteField}
            onTogglePair={togglePairWithNext}
            onUnpairField={unpairField}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onOpenThemeEditor={() => setShowThemeEditor(true)}
            onViewModeChange={setViewMode}
            onCreateNewForm={handleCreateNewForm}
            hasSavedForms={form !== null || (versions && versions.length > 0)}
                  />
                ) : (
          <VersionsList
            onLoadVersion={handleLoadVersion}
            onVersionLoaded={async () => {
              console.log('[FormBuilder] onVersionLoaded callback - refreshing all data...');
              await mutateStoreForm(undefined, { revalidate: true });
              await mutateVersions(undefined, { revalidate: true });
              console.log('[FormBuilder] onVersionLoaded callback - refresh complete');
            }}
            onNavigateToBuilder={() => handleTabSwitch(1)}
            currentFormFields={isEditing && activeTab === 1 ? formFields : undefined}
            currentTheme={isEditing && activeTab === 1 ? theme : undefined}
            currentFormVersionId={currentFormVersionId}
          />
        )}
              </div>
      
      <AddFieldPopup
        isOpen={showAddFieldEditor}
        pendingFieldType={pendingFieldType}
        onAdd={(field) => {
          setFormFields(ensureCoreFields([...formFields, field]));
          setSelectedField(field);
          setShowAddFieldEditor(false);
          setPendingFieldType(null);
        }}
        onClose={() => {
          setShowAddFieldEditor(false);
          setPendingFieldType(null);
        }}
      />
      <FieldEditorPopup
        isOpen={showFieldEditor && !showAddFieldEditor}
        selectedField={selectedField}
        onSave={(field) => {
          updateField(field.id, field);
          setShowFieldEditor(false);
        }}
        onClose={() => setShowFieldEditor(false)}
      />
      <ThemeEditorPopup
        isOpen={showThemeEditor}
        theme={theme}
        onSave={(updatedTheme) => {
          setTheme(updatedTheme);
          setShowThemeEditor(false);
        }}
        onClose={() => setShowThemeEditor(false)}
      />
      

      {/* Load Version Confirmation Modal */}
      <LoadVersionConfirmModal
        isOpen={showLoadVersionConfirm}
        onClose={() => {
          setShowLoadVersionConfirm(false);
          setPendingVersion(null);
        }}
        onConfirm={handleConfirmLoadVersion}
        onConfirmAndGoToBuilder={handleConfirmLoadAndGoToBuilder}
        onSaveAndContinue={handleSaveAndLoadVersion}
        versionName={pendingVersion?.name}
      />

      {/* Unsaved Changes Modal for Tab Switching */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        onClose={() => {
          setShowUnsavedChangesModal(false);
          setPendingTabSwitch(null);
        }}
        onDiscard={handleDiscardAndSwitchTab}
        onSaveAndSwitch={handleShowSaveForTabSwitch}
      />

      {/* SaveModal for Tab Switching */}
      <SaveModal
        isOpen={showSaveModalForTabSwitch}
        onClose={() => {
          setShowSaveModalForTabSwitch(false);
          // Reopen unsaved changes modal if user cancels
          if (pendingTabSwitch !== null) {
            setShowUnsavedChangesModal(true);
          }
        }}
        onSaveToExisting={async (name) => {
          // Close modal first, then save, then switch tabs
          setShowSaveModalForTabSwitch(false);
          await handleSaveAndSwitchTab(name);
        }}
        onSaveAsNew={async (name) => {
          // Close modal first, then save, then switch tabs
          setShowSaveModalForTabSwitch(false);
          await handleSaveAsNewAndSwitchTab(name);
        }}
        currentFormName={currentFormName}
        isNewForm={isNewForm}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmVariant={confirmDialog.confirmVariant || 'danger'}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default FormBuilder;
