'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { FilePlus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<number>(2);
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
  const toast = useToast();
  const [theme, setTheme] = useState<any>(defaultTheme);
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { form, active, scriptUuid, mutate: mutateStoreForm, isError, isLoading } = useStoreForm();
  const { saveForm, setActive } = useStoreFormActions();
  const { saveAsVersion, updateVersion } = useFormVersionActions();
  const { versions, mutate: mutateVersions } = useFormVersions();

  // Determine if form is new (no saved form exists)
  // Note: isEditing flag is now used to control save modal options instead of isNewForm
  const isNewForm = useMemo(() => {
    return form === null && currentFormVersionId === null;
  }, [form, currentFormVersionId]);

  // Initialize form fields when form data is loaded
  // NOTE: This should NOT run when we have a currentFormVersionId because loadVersionData
  // already handles loading version-specific form data. This effect is only for the main store form.
  useEffect(() => {
    // Only process if form is not undefined (either null or an object)
    if (form === undefined) return; // Still loading
    
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
      // Update last saved state
      const loadedTheme = normalizeThemeLayout({ ...defaultTheme, ...(form.theme as any) });
      setLastSavedState({ fields: loadedFields, theme: loadedTheme });
      
      if (form?.theme) {
        const loadedTheme = { ...defaultTheme, ...(form.theme as any) };
        // Normalize layout when loading from saved form
        setTheme(normalizeThemeLayout(loadedTheme));
      }
    } else {
      // Not editing - always show default state
      const defaultFields = ensureCoreFields([]);
      setFormFields(defaultFields);
      setTheme(defaultTheme);
      // Set last saved state to null (no saved form yet)
      setLastSavedState(null);
    }
  }, [form, isEditing, currentFormVersionId]);

  // Check if current form matches any saved version to get its name
  useEffect(() => {
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
      // If no saved state exists, check if current state differs from defaults
      if (!lastSavedState) {
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
  }, [lastSavedState, formFields, theme]);


  const handleReset = () => {
    // Clear all form fields
    const defaultFields = ensureCoreFields([]);
    setFormFields(defaultFields);
    
    // Reset theme to defaults
    const defaultThemeCopy = { ...defaultTheme };
    setTheme(defaultThemeCopy);
    
    // Update last saved state to null (form is reset, not saved)
    setLastSavedState(null);
    
    // Reset form name and version ID
    setCurrentFormName('Unnamed');
    setCurrentFormVersionId(null);
    
    // Reset editing flag (creating new form)
    setIsEditing(false);
    
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
      
      // Save to main form
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
      
      // Update last saved state
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      
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
      
      // Reset editing flag and redirect to Forms tab after successful save
      setIsEditing(false);
      handleReset();
      setActiveTab(2);
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
      await mutateVersions();
      toast.showSuccess('Form saved as new.');
      
      // After successful save: reset Builder tab and switch to Forms tab
      handleReset();
      setActiveTab(2);
    } catch (e: unknown) {
      toast.showError('Failed to save: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDiscardChanges() {
    if (!lastSavedState) {
      // If no saved state, reset to defaults
      setFormFields(ensureCoreFields([]));
      setTheme(defaultTheme);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
      setIsEditing(false);
      toast.showSuccess('Changes discarded.');
      return;
    }
    // Restore from last saved state
    setFormFields([...lastSavedState.fields]);
    setTheme({ ...lastSavedState.theme });
    toast.showSuccess('Changes discarded.');
  }

  function handleCreateNewForm() {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: 'Create New Form',
        message: 'You have unsaved changes. These will be discarded if you create a new form. You can save your current form first, or discard changes to create a new form.',
        onConfirm: async () => {
          // Discard and create new
          setFormFields(ensureCoreFields([]));
          setTheme(defaultTheme);
          setCurrentFormName('Unnamed');
          setCurrentFormVersionId(null);
          setLastSavedState(null);
          setIsEditing(false);
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          toast.showSuccess('New form created.');
        },
        confirmVariant: 'danger'
      });
    } else {
      // No changes, just create new
      setFormFields(ensureCoreFields([]));
      setTheme(defaultTheme);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
      setLastSavedState(null);
      setIsEditing(false);
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
    const loadedTheme = version?.form?.theme 
      ? normalizeThemeLayout({ ...defaultTheme, ...version.form.theme })
      : defaultTheme;
    
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

  function handleTabSwitch(newTab: number) {
    if (isDirty && activeTab !== newTab) {
      setPendingTabSwitch(newTab);
      setShowUnsavedChangesModal(true);
    } else {
      setActiveTab(newTab);
      
      // When switching to Builder tab and not editing, reset to default state
      if (newTab === 1 && !isEditing) {
        const defaultFields = ensureCoreFields([]);
        setFormFields(defaultFields);
        setTheme(defaultTheme);
        setLastSavedState(null);
        setCurrentFormName('Unnamed');
        setCurrentFormVersionId(null);
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

  // Handler to save via SaveAsModal and then switch tabs
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
      
      // Save as a new version
      const result = await saveAsVersion(trimmedName, 'version', { fields: withCore, theme: normalizedTheme });
      
      // Update form name and version ID
      if (result?.id) {
        setCurrentFormName(trimmedName);
        setCurrentFormVersionId(result.id);
      }
      
      // Update last saved state (this marks the form as no longer dirty)
      setLastSavedState({ fields: withCore, theme: normalizedTheme });
      await mutateStoreForm();
      await mutateVersions();
      toast.showSuccess('Form saved.');
      
      // Close SaveModal and switch to target tab
      setShowSaveModalForTabSwitch(false);
      const targetTab = pendingTabSwitch;
      setPendingTabSwitch(null);
      
      // Switch to target tab (form remains as-is, no longer dirty)
      setActiveTab(targetTab);
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
    
    // Fully discard all unsaved changes and reset to clean state
    if (!lastSavedState) {
      // If no saved state, reset to defaults
      setFormFields(ensureCoreFields([]));
      setTheme(defaultTheme);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
      setLastSavedState(null);
      setIsEditing(false);
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
      }
    }
    
    // If switching to Builder tab and not editing, ensure default state
    if (targetTab === 1 && !isEditing) {
      setFormFields(ensureCoreFields([]));
      setTheme(defaultTheme);
      setLastSavedState(null);
      setCurrentFormName('Unnamed');
      setCurrentFormVersionId(null);
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
      {/* Tabs Headers - Always on top */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabSwitch(1)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none rounded-lg border ${
              activeTab === 1
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => handleTabSwitch(2)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none rounded-lg border ${
              activeTab === 2
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            Forms
          </button>
        </div>
        
        {/* Global Actions - Top Right */}
        <div className="flex items-center gap-3">
          {/* New Form Button */}
          <button
            onClick={handleCreateNewForm}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
            title="Create a new form"
          >
            <FilePlus className="w-4 h-4" />
            <span>New Form</span>
          </button>

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
                <span>No form is currently activated</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Action Bar - Only show in Builder tab */}
      {activeTab === 1 && (
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
          onReset={() => setShowResetConfirm(true)}
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
          isNewForm={!isEditing}
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
      
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Form</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to reset? This will clear all form fields and reset the theme to default values. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
            <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-slate-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
            </button>
            <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Reset
            </button>
          </div>
        </div>
          </div>
        </div>
      )}

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
          await handleSaveToExisting(name);
          if (pendingTabSwitch !== null) {
            const targetTab = pendingTabSwitch;
            setPendingTabSwitch(null);
            setShowSaveModalForTabSwitch(false);
            setActiveTab(targetTab);
          }
        }}
        onSaveAsNew={handleSaveAsNewAndSwitchTab}
        currentFormName={currentFormName}
        isNewForm={!isEditing}
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
