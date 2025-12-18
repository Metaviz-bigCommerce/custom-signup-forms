export type FieldType = 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'file' | 'url';

export type FormField = {
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

export type Theme = {
  title: string;
  subtitle: string;
  primaryColor: string;
  layout: 'center' | 'split';
  splitImageUrl: string;
  buttonText: string;
  buttonBg: string;
  buttonColor: string;
  buttonRadius: number;
  formBackgroundColor: string;
};

