# FormBuilder Component Structure

This directory contains the refactored FormBuilder components, split from the original 3000+ line monolithic file into smaller, maintainable components.

## Component Structure

```
FormBuilder/
├── types.ts              # Shared TypeScript types (FormField, FieldType, Theme)
├── utils.ts              # Utility functions (ensureCoreFields, normalizeThemeLayout, etc.)
├── ColorPicker.tsx       # Reusable color picker component
├── LivePreview.tsx       # Live preview of the form
├── AddFieldPopup.tsx     # Modal for adding new fields
├── FieldEditorPopup.tsx  # Modal for editing existing fields
├── ThemeEditorPopup.tsx  # Modal for editing theme settings
├── Sidebar.tsx           # Sidebar with field list and add field buttons
├── TopActionBar.tsx      # Top action bar with form name, save buttons, etc.
├── BuilderTab.tsx        # Main builder tab component
└── README.md            # This file
```

## Component Responsibilities

### Core Components
- **types.ts**: Defines all shared TypeScript types
- **utils.ts**: Contains helper functions used across components

### UI Components
- **ColorPicker.tsx**: Reusable color picker with hex input
- **LivePreview.tsx**: Renders live preview of the form with desktop/mobile views
- **AddFieldPopup.tsx**: Modal for configuring and adding new form fields
- **FieldEditorPopup.tsx**: Modal for editing existing form fields
- **ThemeEditorPopup.tsx**: Modal for editing form theme settings

### Layout Components
- **Sidebar.tsx**: Contains field list, add field buttons, and theme editor button
- **TopActionBar.tsx**: Contains form name, save buttons, and action buttons
- **BuilderTab.tsx**: Orchestrates sidebar and preview in the builder view

## Main FormBuilder.tsx

The main `FormBuilder.tsx` file (in the parent `components/` directory) now:
- Manages all state and business logic
- Handles tab switching (Builder vs Versions)
- Coordinates between components
- Manages form data persistence

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be easily reused or tested independently
3. **Readability**: Smaller files are easier to understand and navigate
4. **Testability**: Individual components can be unit tested
5. **Performance**: Components can be optimized independently

## Usage

The main FormBuilder component imports and uses these sub-components:

```tsx
import BuilderTab from './FormBuilder/BuilderTab';
import LivePreview from './FormBuilder/LivePreview';
// ... etc
```

## Migration Notes

- All state management remains in the main FormBuilder component
- Props are passed down to child components
- Event handlers are passed as callbacks
- Shared types and utilities are imported from this directory

