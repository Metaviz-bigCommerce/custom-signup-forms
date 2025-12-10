'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Settings, X, Palette, RotateCcw, PanelLeftClose, PanelRight, ChevronDown, ChevronUp, Type, Layout, MousePointerClick, Image, Eye, Save, CheckCircle2, XCircle, Loader2, Link2, Unlink, Columns, Edit2, Check } from 'lucide-react';
import { useBcScriptsActions, useStoreForm, useStoreFormActions, useFormVersionActions, useFormVersions } from '@/lib/hooks';
import Skeleton from '@/components/Skeleton';
import SaveFormDropdown from '@/components/SaveFormDropdown';
import VersionsList from '@/components/VersionsList';
import { Tabs } from '@/components/common/tabs';
import LoadVersionConfirmModal from '@/components/LoadVersionConfirmModal';

type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'url';

type FormField = {
  id: number;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  labelColor: string;
  labelSize: string;
  labelWeight: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  bgColor: string;
  padding: string;
  fontSize: string;
  textColor: string;
  // Special semantics for core/address fields
  role?: 'first_name' | 'last_name' | 'email' | 'password' | 'country' | 'state';
  locked?: boolean;
  options?: Array<{ label: string; value: string }>;
  // Row grouping for 2-column layout
  rowGroup?: number | null;
};

const FormBuilder: React.FC = () => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [showFieldEditor, setShowFieldEditor] = useState<boolean>(false);
  const [showThemeEditor, setShowThemeEditor] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [draggedFieldId, setDraggedFieldId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [showLoadVersionConfirm, setShowLoadVersionConfirm] = useState<boolean>(false);
  const [pendingVersion, setPendingVersion] = useState<any>(null);
  const [currentFormName, setCurrentFormName] = useState<string>('Unnamed');
  const [currentFormVersionId, setCurrentFormVersionId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingName, setEditingName] = useState<string>('');
  const defaultTheme = {
    title: 'Create your account',
    subtitle: 'Please fill in the form to continue',
    primaryColor: '#2563eb',
    layout: 'center',
    splitImageUrl: '',
    buttonText: 'Create account',
    buttonBg: '#2563eb',
    buttonColor: '#ffffff',
    buttonRadius: 10
  } as any;
  const [theme, setTheme] = useState<any>(defaultTheme);
  const { addScript, updateScript, deleteScript } = useBcScriptsActions();
  const { form, active, scriptUuid, mutate } = useStoreForm();
  const { saveForm, setActive } = useStoreFormActions();
  const { saveAsVersion, updateVersion } = useFormVersionActions();
  const { versions, mutate: mutateVersions } = useFormVersions();

  const fieldTypes: FieldType[] = ['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file', 'url'];

  // Helper function to normalize theme layout - if split layout but no valid image URL, use center
  const normalizeThemeLayout = (themeToNormalize: any): any => {
    const normalizedTheme = { ...themeToNormalize };
    if (normalizedTheme.layout === 'split') {
      const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
      if (!hasValidImageUrl) {
        normalizedTheme.layout = 'center';
      }
    }
    return normalizedTheme;
  };

  useEffect(() => {
    if (form?.fields?.length) {
      // Ensure the 4 core fields exist in any loaded form
      setFormFields(ensureCoreFields((form.fields as any) || []));
    }
    if (form?.theme) {
      const loadedTheme = { ...defaultTheme, ...(form.theme as any) };
      // Normalize layout when loading from saved form
      setTheme(normalizeThemeLayout(loadedTheme));
    }
  }, [form]);

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

  const isDirty = useMemo(() => {
    if (!form) return false;
    try {
      const fieldsChanged = JSON.stringify(form?.fields || []) !== JSON.stringify(formFields || []);
      const themeChanged = JSON.stringify(form?.theme || defaultTheme) !== JSON.stringify(theme || defaultTheme);
      return fieldsChanged || themeChanged;
    } catch {
      return true;
    }
  }, [form, formFields, theme]);

  // Core required fields that must always exist
  const coreFieldConfigs: Array<Pick<FormField, 'role' | 'label' | 'type' | 'placeholder'>> = [
    { role: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter first name' },
    { role: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
    { role: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
    { role: 'password', label: 'Password', type: 'text', placeholder: 'Create a password' }, // render as password in preview/runtime
  ];

  const ensureCoreFields = (fields: FormField[]): FormField[] => {
    // Separate core and non-core fields
    const coreFields: FormField[] = [];
    const nonCoreFields: FormField[] = [];
    
    // Helper to check if a field matches a core role
    const matchesCoreRole = (field: FormField, role: string): boolean => {
      return field.role === role || 
        (field.label || '').trim().toLowerCase() === (coreFieldConfigs.find(cf => cf.role === role)?.label || '').toLowerCase();
    };
    
    // Separate existing fields
    for (const field of fields) {
      const isCore = coreFieldConfigs.some(cfg => matchesCoreRole(field, cfg.role!));
      if (isCore) {
        coreFields.push(field);
      } else {
        nonCoreFields.push(field);
      }
    }
    
    // Build ordered core fields array
    const orderedCoreFields: FormField[] = [];
    for (const cfg of coreFieldConfigs) {
      const existingField = coreFields.find(f => matchesCoreRole(f, cfg.role!));
      if (existingField) {
        // Update existing field to ensure it has correct properties
        orderedCoreFields.push({
          ...existingField,
          required: true,
          locked: true,
          role: cfg.role as any,
          type: cfg.type as any,
          placeholder: existingField.placeholder || cfg.placeholder,
        });
      } else {
        // Create new core field
        orderedCoreFields.push({
          id: Date.now() + Math.floor(Math.random() * 100000),
          type: cfg.type,
          label: cfg.label,
          placeholder: cfg.placeholder,
          required: true,
          labelColor: '#1f2937',
          labelSize: '14',
          labelWeight: '600',
          borderColor: '#d1d5db',
          borderWidth: '1',
          borderRadius: '6',
          bgColor: '#ffffff',
          padding: '10',
          fontSize: '14',
          textColor: '#1f2937',
          role: cfg.role as any,
          locked: true,
        });
      }
    }
    
    // Return core fields first (in correct order), then non-core fields
    return [...orderedCoreFields, ...nonCoreFields];
  };

  const handleReset = () => {
    // Clear all form fields
    setFormFields(ensureCoreFields([]));
    
    // Reset theme to defaults
    setTheme({ ...defaultTheme });
    
    // Reset form name
    setCurrentFormName('Unnamed');
    setCurrentFormVersionId(null);
    
    // Close any open popups
    setShowFieldEditor(false);
    setShowThemeEditor(false);
    setSelectedField(null);
    setShowResetConfirm(false);
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: Date.now(),
      type,
      label: type === 'text' ? 'New text field' : `New ${type} field`,
      placeholder: type === 'phone' ? 'Enter phone' : `Enter ${type}`,
      required: false,
      labelColor: '#1f2937',
      labelSize: '14',
      labelWeight: '500',
      borderColor: '#d1d5db',
      borderWidth: '1',
      borderRadius: '6',
      bgColor: '#ffffff',
      padding: '10',
      fontSize: '14',
      textColor: '#1f2937'
    };
    setFormFields(ensureCoreFields([...formFields, newField]));
    setSelectedField(newField);
    setShowFieldEditor(true);
  };

  const addAddressField = (role: 'country' | 'state') => {
    const label = role === 'country' ? 'Country' : 'State / Province';
    const newField: FormField = {
      id: Date.now(),
      type: 'select',
      label,
      placeholder: role === 'country' ? 'Select a country' : 'Select a state/province',
      required: false,
      labelColor: '#1f2937',
      labelSize: '14',
      labelWeight: '500',
      borderColor: '#d1d5db',
      borderWidth: '1',
      borderRadius: '6',
      bgColor: '#ffffff',
      padding: '10',
      fontSize: '14',
      textColor: '#1f2937',
      role,
    };
    setFormFields(ensureCoreFields([...formFields, newField]));
    setSelectedField(newField);
    setShowFieldEditor(true);
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
      // When saving main form, check if it matches any version to update name
      await mutate();
      // The useEffect will automatically update the name if it matches a version
      alert('Form saved.');
    } catch (e: any) {
      alert('Failed to save form: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsDraft(name: string) {
    setIsSaving(true);
    try {
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      const result = await saveAsVersion(name || `Draft ${new Date().toLocaleDateString()}`, 'draft', { fields: withCore, theme: normalizedTheme });
      // Update form name if we got a version ID back
      if (result?.id) {
        setCurrentFormName(name || `Draft ${new Date().toLocaleDateString()}`);
        setCurrentFormVersionId(result.id);
      }
      await mutate();
      alert('Draft saved successfully.');
    } catch (e: any) {
      alert('Failed to save draft: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAsVersion(name: string) {
    setIsSaving(true);
    try {
      // If name is empty and form is not unnamed, use current form name
      const finalName = name.trim() || (currentFormName !== 'Unnamed' ? currentFormName : '');
      if (!finalName) {
        alert('Version name is required');
        setIsSaving(false);
        return;
      }
      const normalizedTheme = normalizeThemeLayout(theme);
      const withCore = ensureCoreFields(formFields);
      const result = await saveAsVersion(finalName, 'version', { fields: withCore, theme: normalizedTheme });
      // Update form name if we got a version ID back
      if (result?.id) {
        setCurrentFormName(finalName);
        setCurrentFormVersionId(result.id);
      }
      await mutate();
      alert('Version saved successfully.');
    } catch (e: any) {
      alert('Failed to save version: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleLoadVersion(version: any) {
    if (isDirty) {
      // Show confirmation modal if there are unsaved changes
      setPendingVersion(version);
      setShowLoadVersionConfirm(true);
      return;
    }
    // Load version directly if no unsaved changes
    loadVersionData(version);
  }

  function loadVersionData(version: any, goToBuilder: boolean = false) {
    if (version?.form?.fields) {
      setFormFields(ensureCoreFields(version.form.fields));
    }
    if (version?.form?.theme) {
      const loadedTheme = { ...defaultTheme, ...version.form.theme };
      setTheme(normalizeThemeLayout(loadedTheme));
    }
    // Update form name and version ID
    setCurrentFormName(version?.name || 'Unnamed');
    setCurrentFormVersionId(version?.id || null);
    if (goToBuilder) {
      setActiveTab(1); // Switch to Builder tab
    }
    setShowLoadVersionConfirm(false);
    setPendingVersion(null);
  }

  function handleConfirmLoadVersion() {
    if (pendingVersion) {
      loadVersionData(pendingVersion, false);
    }
  }

  function handleConfirmLoadAndGoToBuilder() {
    if (pendingVersion) {
      loadVersionData(pendingVersion, true);
    }
  }

  async function handleSaveName() {
    if (!editingName.trim()) {
      alert('Name cannot be empty');
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
            alert('Failed to save name: ' + (e?.message || 'Unknown error'));
          });
      } else {
        // If it's unnamed, save as a new draft with this name
        const normalizedTheme = normalizeThemeLayout(theme);
        const withCore = ensureCoreFields(formFields);
        saveAsVersion(trimmedName, 'draft', { fields: withCore, theme: normalizedTheme })
          .then((result) => {
            if (result?.id) {
              setCurrentFormVersionId(result.id);
              mutateVersions().catch(() => {}); // Silently fail mutate
            }
          })
          .catch((e: any) => {
            // Revert on error
            setCurrentFormName('Unnamed');
            alert('Failed to save name: ' + (e?.message || 'Unknown error'));
          });
      }
    } catch (e: any) {
      // Revert on error
      setCurrentFormName(previousName);
      alert('Failed to save name: ' + (e?.message || 'Unknown error'));
    }
  }

  async function handleActivate() {
    setIsToggling(true);
    try {
      // Normalize theme layout before generating script
      const normalizedTheme = normalizeThemeLayout(theme);
      // Generate embed JS for current fields
      const withCore = ensureCoreFields(formFields);
      await fetch('/api/generate-signup-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formFields: withCore, theme: normalizedTheme })
      });
      const data = await addSignupFormScript();
      const uuid = (data as any)?.data?.uuid;
      await setActive(true);
      await mutate();
      alert('Form activated' + (uuid ? `: ${uuid}` : '.'));
    } catch (e: any) {
      alert('Failed to activate: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeactivate() {
    setIsToggling(true);
    try {
      if (scriptUuid) {
        await deleteScript(scriptUuid);
      }
      await setActive(false);
      await mutate();
      alert('Form deactivated.');
    } catch (e: any) {
      alert('Failed to deactivate: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsToggling(false);
    }
  }

  if (form === undefined) {
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

  const deleteField = (id: number) => {
    const f = formFields.find(ff => ff.id === id);
    if (f?.locked || (f?.role && ['first_name','last_name','email','password'].includes(f.role))) {
      alert('This field is required and cannot be removed.');
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

  const FormPreview = () => {
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
            
            return groupedFields.map((group, groupIndex) => {
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
              onClick={() => setViewMode('desktop')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setViewMode('mobile')}
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
                  {hasValidImageUrl ? (
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
                  ) : null}
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
                    background: 'rgba(255,255,255,0.9)',
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
                    background: 'rgba(255,255,255,0.9)',
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

  const FieldEditorPopup = () => {
    const [localField, setLocalField] = useState<FormField | null>(null);
    const fieldIdRef = useRef<number | null>(null);
    const initialFieldRef = useRef<FormField | null>(null);
    const [openSection, setOpenSection] = useState<'basic' | 'labelStyle' | 'inputStyle' | null>('basic');

    useEffect(() => {
      if (selectedField && showFieldEditor) {
        // Only update local state if the field ID changed or popup just opened
        if (fieldIdRef.current !== selectedField.id || !localField) {
          const fieldCopy = { ...selectedField };
          setLocalField(fieldCopy);
          initialFieldRef.current = fieldCopy;
          fieldIdRef.current = selectedField.id;
          // Reset to first section when popup opens
          setOpenSection('basic');
        }
      } else {
        setLocalField(null);
        initialFieldRef.current = null;
        fieldIdRef.current = null;
        setOpenSection(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedField?.id, showFieldEditor]);

    // All hooks must be called before any early returns
    const hasChanges = useMemo(() => {
      if (!localField || !initialFieldRef.current) return false;
      return JSON.stringify(localField) !== JSON.stringify(initialFieldRef.current);
    }, [localField]);

    if (!localField || !showFieldEditor) return null;

    const handleChange = (updates: Partial<FormField>) => {
      if (!localField) return;
      const updatedField = { ...localField, ...updates };
      setLocalField(updatedField);
    };

    const handleSave = () => {
      if (!localField || !fieldIdRef.current) return;
      // Apply all changes to parent state
      updateField(fieldIdRef.current, localField);
      setShowFieldEditor(false);
    };

    const handleClose = () => {
      // Discard changes and reset to initial state
      if (initialFieldRef.current) {
        setLocalField({ ...initialFieldRef.current });
      }
      setShowFieldEditor(false);
    };

    // Accordion behavior: only one section can be open at a time
    // If clicking the currently open section, close it. Otherwise, open the clicked section (this automatically closes any other open section)
    const toggleSection = (section: 'basic' | 'labelStyle' | 'inputStyle') => {
      setOpenSection((prev) => {
        // If clicking the same section that's already open, close it
        if (prev === section) {
          return null;
        }
        // Otherwise, open the clicked section (this replaces the previous value, closing any other section)
        return section;
      });
    };

    const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 rounded-md border border-slate-300 cursor-pointer flex-shrink-0"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 h-10 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#000000"
          />
        </div>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Field</h3>
                <p className="text-xs text-gray-500 capitalize">{localField.type} field</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Panel - Settings */}
              <div className="p-6 space-y-4 border-r border-slate-200">
                {/* Basic Settings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Basic Settings</span>
                    </div>
                    {openSection === 'basic' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'basic' && (
                    <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                        <input
                          type="text"
                          value={localField.label}
                          onChange={(e) => handleChange({ label: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Placeholder</label>
                        <input
                          type="text"
                          value={localField.placeholder}
                          onChange={(e) => handleChange({ placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-slate-200">
                        <input
                          type="checkbox"
                          checked={localField.required}
                          onChange={(e) => !localField.locked && handleChange({ required: e.target.checked })}
                          className={`w-4 h-4 rounded focus:ring-2 ${localField.locked ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 cursor-pointer'} `}
                          id="required-checkbox"
                          disabled={!!localField.locked}
                        />
                        <label htmlFor="required-checkbox" className={`text-sm font-medium ${localField.locked ? 'text-gray-400' : 'text-gray-700'} ${localField.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          Required field {localField.locked ? '(always on)' : ''}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Label Styling */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('labelStyle')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Label Styling</span>
                    </div>
                    {openSection === 'labelStyle' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'labelStyle' && (
                    <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                      <ColorPicker
                        label="Color"
                        value={localField.labelColor}
                        onChange={(value) => handleChange({ labelColor: value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Size (px)</label>
                          <input
                            type="number"
                            value={localField.labelSize}
                            onChange={(e) => handleChange({ labelSize: e.target.value })}
                            className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Weight</label>
                          <select
                            value={localField.labelWeight}
                            onChange={(e) => handleChange({ labelWeight: e.target.value })}
                            className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="400">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semi-bold</option>
                            <option value="700">Bold</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Styling */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('inputStyle')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Input Styling</span>
                    </div>
                    {openSection === 'inputStyle' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'inputStyle' && (
                    <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Border Color"
                          value={localField.borderColor}
                          onChange={(value) => handleChange({ borderColor: value })}
                        />
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Border Width (px)</label>
                          <input
                            type="number"
                            value={localField.borderWidth}
                            onChange={(e) => handleChange({ borderWidth: e.target.value })}
                            className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Border Radius (px)</label>
                          <input
                            type="number"
                            value={localField.borderRadius}
                            onChange={(e) => handleChange({ borderRadius: e.target.value })}
                            className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Padding (px)</label>
                          <input
                            type="number"
                            value={localField.padding}
                            onChange={(e) => handleChange({ padding: e.target.value })}
                            className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Background"
                          value={localField.bgColor}
                          onChange={(value) => handleChange({ bgColor: value })}
                        />
                        <ColorPicker
                          label="Text Color"
                          value={localField.textColor}
                          onChange={(value) => handleChange({ textColor: value })}
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Font Size (px)</label>
                        <input
                          type="number"
                          value={localField.fontSize}
                          onChange={(e) => handleChange({ fontSize: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Live Preview */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Live Preview</h4>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
                    <div className="space-y-3">
                      <label 
                        style={{ 
                          color: localField.labelColor, 
                          fontSize: localField.labelSize + 'px', 
                          fontWeight: localField.labelWeight 
                        }}
                        className="block"
                      >
                        {localField.label || 'Field Label'} {localField.required && <span className="text-red-500">*</span>}
                      </label>
                      {localField.type === 'textarea' ? (
                        <textarea
                          placeholder={localField.placeholder}
                          style={{
                            borderColor: localField.borderColor,
                            borderWidth: localField.borderWidth + 'px',
                            borderRadius: localField.borderRadius + 'px',
                            backgroundColor: localField.bgColor,
                            padding: localField.padding + 'px',
                            fontSize: localField.fontSize + 'px',
                            color: localField.textColor
                          }}
                          className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={localField.type === 'phone' ? 'tel' : localField.type}
                          placeholder={localField.placeholder}
                          style={{
                            borderColor: localField.borderColor,
                            borderWidth: localField.borderWidth + 'px',
                            borderRadius: localField.borderRadius + 'px',
                            backgroundColor: localField.bgColor,
                            padding: localField.padding + 'px',
                            fontSize: localField.fontSize + 'px',
                            color: localField.textColor
                          }}
                          className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>You have unsaved changes</span>
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ThemeEditorPopup = () => {
    const [localTheme, setLocalTheme] = useState<any>(null);
    const initialThemeRef = useRef<any>(null);
    const [openSection, setOpenSection] = useState<'content' | 'layout' | 'button' | null>('content');

    useEffect(() => {
      if (showThemeEditor) {
        const themeCopy = { ...theme };
        setLocalTheme(themeCopy);
        initialThemeRef.current = themeCopy;
        // Reset to first section when popup opens
        setOpenSection('content');
      } else {
        setLocalTheme(null);
        initialThemeRef.current = null;
        setOpenSection(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showThemeEditor]);

    // All hooks must be called before any early returns
    const hasChanges = useMemo(() => {
      if (!localTheme || !initialThemeRef.current) return false;
      return JSON.stringify(localTheme) !== JSON.stringify(initialThemeRef.current);
    }, [localTheme]);

    if (!localTheme || !showThemeEditor) return null;

    const handleThemeChange = (updates: any) => {
      const updatedTheme = { ...localTheme, ...updates };
      setLocalTheme(updatedTheme);
    };

    const handleSave = () => {
      if (!localTheme) return;
      // Apply all changes to parent state
      setTheme(localTheme);
      setShowThemeEditor(false);
    };

    const handleClose = () => {
      // Discard changes and reset to initial state
      if (initialThemeRef.current) {
        setLocalTheme({ ...initialThemeRef.current });
      }
      setShowThemeEditor(false);
    };

    // Accordion behavior: only one section can be open at a time
    // If clicking the currently open section, close it. Otherwise, open the clicked section (this automatically closes any other open section)
    const toggleSection = (section: 'content' | 'layout' | 'button') => {
      setOpenSection((prev) => {
        // If clicking the same section that's already open, close it
        if (prev === section) {
          return null;
        }
        // Otherwise, open the clicked section (this replaces the previous value, closing any other section)
        return section;
      });
    };

    const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
      <div className="w-full">
        <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-12 rounded-md border border-slate-300 cursor-pointer flex-shrink-0"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 h-10 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#000000"
          />
        </div>
      </div>
    );

    const hasValidImageUrl = localTheme.layout === 'split' && localTheme.splitImageUrl && localTheme.splitImageUrl.trim().length > 0;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Edit Theme Settings</h3>
                <p className="text-xs text-gray-500">Customize your form appearance</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Panel - Settings */}
              <div className="p-6 space-y-4 border-r border-slate-200">
                {/* Content Settings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('content')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Content</span>
                    </div>
                    {openSection === 'content' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'content' && (
                    <div key="content-section" className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                        <input
                          type="text"
                          value={localTheme.title}
                          onChange={(e) => handleThemeChange({ title: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
                        <input
                          type="text"
                          value={localTheme.subtitle}
                          onChange={(e) => handleThemeChange({ subtitle: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <ColorPicker
                        label="Primary Color"
                        value={localTheme.primaryColor}
                        onChange={(value) => handleThemeChange({ primaryColor: value })}
                      />
                    </div>
                  )}
                </div>

                {/* Layout Settings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('layout')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Layout</span>
                    </div>
                    {openSection === 'layout' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'layout' && (
                    <div key="layout-section" className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout Type</label>
                        <select
                          value={localTheme.layout}
                          onChange={(e) => handleThemeChange({ layout: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="center">Center</option>
                          <option value="split">Split</option>
                        </select>
                      </div>
                      {localTheme.layout === 'split' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Split Image URL
                            {!hasValidImageUrl && (
                              <span className="ml-2 text-xs text-amber-600 font-normal">(Will use center layout if empty)</span>
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="https://example.com/hero.jpg"
                              value={localTheme.splitImageUrl}
                              onChange={(e) => handleThemeChange({ splitImageUrl: e.target.value })}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            {localTheme.splitImageUrl && (
                              <div className="relative group">
                                <Image className="w-10 h-10 p-2 text-gray-400 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50" />
                                <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-white rounded-md shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  <img src={localTheme.splitImageUrl} alt="Preview" className="w-full h-32 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Button Settings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('button')}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Submit Button</span>
                    </div>
                    {openSection === 'button' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  {openSection === 'button' && (
                    <div key="button-section" className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                        <input
                          type="text"
                          value={localTheme.buttonText}
                          onChange={(e) => handleThemeChange({ buttonText: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="Background"
                          value={localTheme.buttonBg}
                          onChange={(value) => handleThemeChange({ buttonBg: value })}
                        />
                        <ColorPicker
                          label="Text Color"
                          value={localTheme.buttonColor}
                          onChange={(value) => handleThemeChange({ buttonColor: value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
                        <input
                          type="number"
                          value={localTheme.buttonRadius}
                          onChange={(e) => handleThemeChange({ buttonRadius: Number(e.target.value) })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Live Preview */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="sticky top-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <h4 className="text-sm font-semibold text-gray-700">Live Preview</h4>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
                    <div className="space-y-4">
                      <div>
                        <h2 
                          className="text-2xl font-bold mb-2"
                          style={{ color: localTheme.primaryColor }}
                        >
                          {localTheme.title || 'Create your account'}
                        </h2>
                        <p className="text-gray-600 text-sm mb-6">
                          {localTheme.subtitle || 'Please fill in the form to continue'}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Sample Field</label>
                          <input
                            type="text"
                            placeholder="Enter text here"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          backgroundColor: localTheme.buttonBg,
                          color: localTheme.buttonColor,
                          borderRadius: localTheme.buttonRadius + 'px',
                          marginTop: '16px',
                          width: '100%',
                          padding: '12px 24px',
                          fontSize: '16px',
                          fontWeight: '500',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        className="hover:opacity-90 transition-opacity"
                      >
                        {localTheme.buttonText || 'Create account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>You have unsaved changes</span>
              </div>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Headers - Always on top */}
      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none rounded-lg border ${
              activeTab === 1
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative focus:outline-none rounded-lg border ${
              activeTab === 2
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            Versions
          </button>
        </div>
      </div>

      {/* Top Action Bar - Only show in Builder tab */}
      {activeTab === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
          <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between relative">
            {/* Left Section - Status & Info */}
            <div className="flex items-center gap-4">
              {/* Form Name */}
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName();
                        } else if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setEditingName('');
                        }
                      }}
                      className="px-3 py-1.5 text-lg font-semibold text-gray-800 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Save name"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditingName('');
                      }}
                      className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 
                      className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => {
                        setEditingName(currentFormName);
                        setIsEditingName(true);
                      }}
                      title="Click to edit name"
                    >
                      {currentFormName}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingName(currentFormName);
                        setIsEditingName(true);
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 rounded-md transition-all"
                      title="Edit name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  active 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Inactive</span>
                    </>
                  )}
                </div>
                {isDirty && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Secondary Actions */}
              <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:scale-[0.98]"
                  title="Reset form to default"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Primary Actions */}
              <div className="flex items-center gap-2">
                <SaveFormDropdown
                  isDirty={isDirty}
                  isSaving={isSaving}
                  currentFormName={currentFormName}
                  onSave={handleSaveForm}
                  onSaveAsDraft={handleSaveAsDraft}
                  onSaveAsVersion={handleSaveAsVersion}
                />

                {active ? (
                  <button
                    onClick={handleDeactivate}
                    disabled={isToggling}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      isToggling
                        ? 'bg-rose-300 text-white cursor-not-allowed' 
                        : 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg active:scale-[0.98] shadow-md'
                    }`}
                    title="Deactivate form"
                  >
                    {isToggling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Deactivating…</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Deactivate</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleActivate}
                    disabled={isToggling}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      isToggling
                        ? 'bg-emerald-300 text-white cursor-not-allowed' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] shadow-md'
                    }`}
                    title="Activate form"
                  >
                    {isToggling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 1 ? (
          <div className={`flex h-full transition-all duration-300 ease-in-out relative ${sidebarOpen ? 'gap-6' : 'gap-0'}`}>
            {/* Floating toggle button when sidebar is closed - positioned on left edge */}
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-16 bg-white border-r border-t border-b border-slate-200 rounded-r-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:bg-gray-50 group backdrop-blur-sm bg-white/95"
                    aria-label="Show sidebar"
                    title="Show sidebar"
                  >
                    <PanelRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  </button>
                )}

                {/* Sidebar */}
                <aside 
                  className={`bg-white rounded-xl shadow-md border border-slate-200 h-full overflow-hidden transition-all duration-300 ease-in-out relative ${
                    sidebarOpen 
                      ? 'w-[25%] min-w-[280px] opacity-100' 
                      : 'w-0 min-w-0 opacity-0 overflow-hidden border-0'
                  }`}
                >
                  {sidebarOpen && (
                    <>
                      {/* Sidebar Header with Toggle */}
                      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm bg-white/95">
                        <h3 className="text-lg font-semibold text-gray-800">Form Builder</h3>
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                          aria-label="Hide sidebar"
                          title="Hide sidebar"
                        >
                          <PanelLeftClose className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Sidebar Content */}
                      <div className="p-6 h-[calc(100%-73px)] overflow-y-auto">
                        <div className="mb-6">
                          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Add New Field</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Basic Inputs</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['text', 'email', 'phone', 'number'].map(type => (
                              <button
                                key={type}
                                    onClick={() => addField(type as FieldType)}
                                    className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                              >
                                <Plus className="w-3 h-3 inline mr-1" />
                                {type}
                              </button>
                            ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Selection Fields</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['textarea', 'select', 'radio', 'checkbox'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => addField(type as FieldType)}
                                    className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                                  >
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Address Fields</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => addAddressField('country')}
                                  className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all"
                                >
                                  <Plus className="w-3 h-3 inline mr-1" />
                                  Country
                                </button>
                                <button
                                  onClick={() => addAddressField('state')}
                                  className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all"
                                >
                                  <Plus className="w-3 h-3 inline mr-1" />
                                  State / Province
                                </button>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Special Fields</div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['date', 'file', 'url'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => addField(type as FieldType)}
                                    className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                                  >
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <button
                            onClick={() => setShowThemeEditor(true)}
                            className="w-full px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-slate-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <Palette className="w-4 h-4" />
                            Edit Theme
                          </button>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-4">Form Fields</h3>
                          <div className="space-y-3">
                            {(() => {
                              // Group fields by rowGroup for rendering
                              const processedIds = new Set<number>();
                              const fieldGroups: Array<{ fields: FormField[]; isPaired: boolean; rowGroup: number | null }> = [];
                              
                              for (let i = 0; i < formFields.length; i++) {
                                if (processedIds.has(formFields[i].id)) continue;
                                
                                const field = formFields[i];
                                if (field.rowGroup != null) {
                                  // Find all fields with the same rowGroup
                                  const groupFields = formFields.filter(f => f.rowGroup === field.rowGroup);
                                  fieldGroups.push({ fields: groupFields, isPaired: true, rowGroup: field.rowGroup });
                                  groupFields.forEach(f => processedIds.add(f.id));
                                } else {
                                  // Single unpaired field
                                  fieldGroups.push({ fields: [field], isPaired: false, rowGroup: null });
                                  processedIds.add(field.id);
                                }
                              }
                              
                              return fieldGroups.map((group, groupIndex) => {
                                const groupStartIndex = formFields.findIndex(f => f.id === group.fields[0].id);
                                
                                if (group.isPaired && group.fields.length === 2) {
                                  // Render paired fields in a single purple container
                                  const [field1, field2] = group.fields;
                                  const isDragging1 = draggedFieldId === field1.id;
                                  const isDragging2 = draggedFieldId === field2.id;
                                  const isDragging = isDragging1 || isDragging2;
                                  const isDragOver = dragOverIndex === groupStartIndex;
                                  
                                  return (
                                    <div 
                                      key={`pair-${group.rowGroup}`}
                                      className="border-2 border-purple-400 bg-purple-50/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                      {/* Container header */}
                                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                                        <Columns className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Paired Fields</span>
                                      </div>
                                      
                                      {/* Paired fields */}
                                      <div className="space-y-2">
                                        {group.fields.map((field, fieldIndex) => {
                                          const fieldIndexInList = formFields.findIndex(f => f.id === field.id);
                                          const isDraggingField = draggedFieldId === field.id;
                                          const isDragOverField = dragOverIndex === fieldIndexInList;
                                          const nextFieldInList = fieldIndexInList < formFields.length - 1 ? formFields[fieldIndexInList + 1] : null;
                                          const isPairedWithNext = nextFieldInList && field.rowGroup != null && nextFieldInList.rowGroup === field.rowGroup;
                                          
                                          return (
                                            <div
                                              key={field.id}
                                              draggable
                                              onDragStart={(e) => handleDragStart(e, field.id)}
                                              onDragOver={(e) => handleDragOver(e, fieldIndexInList)}
                                              onDragLeave={handleDragLeave}
                                              onDrop={(e) => handleDrop(e, fieldIndexInList)}
                                              onDragEnd={handleDragEnd}
                                              onClick={() => handleFieldClick(field)}
                                              className={`flex items-center gap-3 p-2.5 rounded-md border cursor-move transition-all duration-200 ${
                                                isDraggingField
                                                  ? 'opacity-50 bg-gray-100 border-gray-300'
                                                  : isDragOverField
                                                    ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-sm'
                                                    : selectedField?.id === field.id
                                                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                                                      : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm'
                                              }`}
                                            >
                                              <GripVertical className="w-4 h-4 text-purple-500 cursor-grab active:cursor-grabbing flex-shrink-0" />
                                              <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-800 truncate">{field.label}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                  <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                                                  {field.locked && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                                      Required
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0">
                                                {/* Only show pair button on first field in pair, and only if not already paired */}
                                                {fieldIndex === 0 && fieldIndexInList < formFields.length - 1 && !isPairedWithNext && (
                                                  <button
                                                    onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                      togglePairWithNext(field.id);
                                                    }}
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                    title="Pair with next field"
                                                  >
                                                    <Link2 className="w-4 h-4" />
                                                  </button>
                                                )}
                                                {/* Show unpair button for all fields in a pair */}
                                                <button 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    unpairField(field.id);
                                                  }}
                                                  className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                                                  title="Unpair field"
                                                >
                                                  <Unlink className="w-4 h-4" />
                                                </button>
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                                  className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                  title="Delete field"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                } else {
                                  // Render unpaired field normally
                                  const field = group.fields[0];
                                  const fieldIndex = formFields.findIndex(f => f.id === field.id);
                                  const isPaired = field.rowGroup != null;
                                  const nextField = fieldIndex < formFields.length - 1 ? formFields[fieldIndex + 1] : null;
                                  const isPairedWithNext = nextField && field.rowGroup != null && nextField.rowGroup === field.rowGroup;
                                  const isDragging = draggedFieldId === field.id;
                                  const isDragOver = dragOverIndex === fieldIndex;
                                  
                                  return (
                                    <div key={field.id}>
                                      <div 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, field.id)}
                                        onDragOver={(e) => handleDragOver(e, fieldIndex)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, fieldIndex)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => handleFieldClick(field)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-move transition-all duration-200 ${
                                          isDragging
                                            ? 'opacity-50 bg-gray-100 border-gray-300'
                                            : isDragOver
                                              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md ring-2 ring-blue-200'
                                              : selectedField?.id === field.id 
                                                ? 'border-blue-400 bg-blue-50 shadow-sm' 
                                                : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                                        }`}
                                      >
                                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-blue-500 transition-colors" />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-gray-800 truncate">{field.label}</div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                                            {field.locked && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                                Required
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {/* Only show pair button if field is not already paired */}
                                          {!isPaired && fieldIndex < formFields.length - 1 && (
                                            <button
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                togglePairWithNext(field.id);
                                              }}
                                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                              title="Pair with next field"
                                            >
                                              <Link2 className="w-4 h-4" />
                                            </button>
                                          )}
                                          {/* Show unpair button only if field is paired */}
                                          {isPaired && (
                                            <button
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                unpairField(field.id);
                                              }}
                                              className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                                              title="Unpair field"
                                            >
                                              <Unlink className="w-4 h-4" />
                                            </button>
                                          )}
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                            className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            title="Delete field"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              });
                            })()}
                            {formFields.length === 0 && (
                              <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No fields yet. Add a field to get started.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
            </aside>

            {/* Preview Area */}
            <div className={`h-full overflow-y-auto transition-all duration-300 ease-in-out flex-1 min-w-0`}>
              <FormPreview />
            </div>
          </div>
        ) : (
          <VersionsList
            onLoadVersion={handleLoadVersion}
            onVersionLoaded={() => mutate()}
          />
        )}
      </div>
      
      <FieldEditorPopup />
      <ThemeEditorPopup />
      
      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-xl shadow-md max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Form Builder</h3>
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
        versionName={pendingVersion?.name}
      />
    </div>
  );
};

export default FormBuilder;

