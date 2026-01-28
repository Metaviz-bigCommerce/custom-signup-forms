import { FormField, Theme } from './types';

export const defaultTheme: Theme = {
  title: 'Create your account',
  subtitle: 'Please fill in the form to continue',
  titleColor: '#2563eb', // Uses primary color by default
  titleFontSize: 22,
  titleFontWeight: '800',
  subtitleColor: '#2563eb', // Also uses primary color by default (matches title)
  subtitleFontSize: 13,
  subtitleFontWeight: '400',
  primaryColor: '#2563eb',
  layout: 'center',
  splitImageUrl: '',
  buttonText: 'Create account',
  buttonBg: '#2563eb',
  buttonColor: '#ffffff',
  buttonRadius: 10,
  formBackgroundColor: '#ffffff',
  pageBackgroundColor: '#f9fafb'
};

// Default branding presets similar to email templates
export const brandingPresets: Array<{ name: string; primaryColor: string; pageBackgroundColor: string }> = [
  { name: 'Sky Blue', primaryColor: '#2563eb', pageBackgroundColor: '#f0f9ff' },
  { name: 'Emerald Green', primaryColor: '#059669', pageBackgroundColor: '#ecfdf5' },
  { name: 'Rose Red', primaryColor: '#e11d48', pageBackgroundColor: '#fff1f2' },
  { name: 'Amber', primaryColor: '#d97706', pageBackgroundColor: '#fffbeb' },
  { name: 'Indigo', primaryColor: '#6366f1', pageBackgroundColor: '#eef2ff' },
  { name: 'Purple', primaryColor: '#9333ea', pageBackgroundColor: '#faf5ff' },
  { name: 'Teal', primaryColor: '#0d9488', pageBackgroundColor: '#f0fdfa' },
  { name: 'Orange', primaryColor: '#ea580c', pageBackgroundColor: '#fff7ed' }
];

// Helper function to normalize theme layout - if split layout but no valid image URL, use center
// Note: We no longer remove formBackgroundColor when it matches the default, as users may explicitly set it to white
export const normalizeThemeLayout = (themeToNormalize: any): any => {
  const normalizedTheme = { ...themeToNormalize };
  if (normalizedTheme.layout === 'split') {
    const hasValidImageUrl = normalizedTheme.splitImageUrl && normalizedTheme.splitImageUrl.trim().length > 0;
    if (!hasValidImageUrl) {
      normalizedTheme.layout = 'center';
    }
  }
  // Keep all theme properties including formBackgroundColor, even if it matches the default
  // This ensures user's explicit choices are preserved
  return normalizedTheme;
};

// Core required fields that must always exist
export const coreFieldConfigs: Array<Pick<FormField, 'role' | 'label' | 'type' | 'placeholder'>> = [
  { role: 'first_name', label: 'First Name', type: 'text', placeholder: 'Enter first name' },
  { role: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
  { role: 'email', label: 'Email', type: 'email', placeholder: 'Enter your email' },
  { role: 'password', label: 'Password', type: 'text', placeholder: 'Create a password' }, // render as password in preview/runtime
];

export const ensureCoreFields = (fields: FormField[]): FormField[] => {
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
        labelWeight: '500',
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

// Helper function to normalize fields for comparison (remove IDs for comparison)
export const normalizeFieldsForComparison = (fields: FormField[]): any[] => {
  return fields.map(({ id: _id, ...rest }) => rest).sort((a, b) => {
    // Sort by role first (core fields first), then by label
    const roleOrder = ['first_name', 'last_name', 'email', 'password'];
    const aRoleIndex = roleOrder.indexOf(a.role || '');
    const bRoleIndex = roleOrder.indexOf(b.role || '');
    if (aRoleIndex !== -1 && bRoleIndex !== -1) return aRoleIndex - bRoleIndex;
    if (aRoleIndex !== -1) return -1;
    if (bRoleIndex !== -1) return 1;
    return (a.label || '').localeCompare(b.label || '');
  });
};

