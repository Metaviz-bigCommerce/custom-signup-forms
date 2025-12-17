# Form Builder - User Flows & Use Cases Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Activate/Deactivate Flow](#1-activatedeactivate-flow)
3. [Reset Functionality](#2-reset-functionality)
4. [Three Save Types](#3-three-save-types)
5. [Additional Flows](#4-additional-flows)
6. [Complete User Journey Examples](#5-complete-user-journey-examples)
7. [State Management Summary](#6-state-management-summary)

---

## Overview

The Form Builder is a comprehensive tool for creating and managing custom signup forms. It allows users to:
- Add and configure form fields
- Customize styling and theme
- Save work in multiple ways
- Activate/deactivate the form on the storefront
- Manage versions and drafts
- Reset to defaults

---

## 1. Activate/Deactivate Flow

### Purpose
Controls whether the form is live on the storefront and visible to customers.

### 🔵 Activate Flow

**When user clicks "Activate":**

1. **Generates Signup Script**
   - Takes current form fields and theme
   - Creates JavaScript embed code
   - Generates `/custom-signup.min.js` file

2. **Creates/Updates BigCommerce Script**
   - Adds script to store's theme via BigCommerce API
   - Script loads on all pages (in `<head>`)
   - Script UUID is stored for future updates

3. **Sets Active Status**
   - Updates database: `signupFormActive: true`
   - Button changes to "Deactivate" (red color)

4. **User Feedback**
   - Shows success toast: "Form activated: [UUID]"
   - Button shows "Deactivating…" during process

**Use Cases:**
- ✅ First-time activation: Creates script and activates form
- ✅ Re-activation: Updates existing script if it exists
- ✅ After form changes: Regenerates script with latest form data
- ✅ Testing: Activate to test form on live storefront

**Important Notes:**
- ⚠️ Activation requires a saved form (script generation needs form data)
- ⚠️ Script is regenerated on each activation
- ⚠️ Form must be saved before activation (to have data to generate script from)

---

### 🔴 Deactivate Flow

**When user clicks "Deactivate":**

1. **Removes Script**
   - Deletes BigCommerce script from store theme
   - Removes script UUID reference

2. **Sets Inactive Status**
   - Updates database: `signupFormActive: false`
   - Button changes to "Activate" (green color)

3. **User Feedback**
   - Shows success toast: "Form deactivated."
   - Button shows "Deactivating…" during process

**Use Cases:**
- ✅ Temporarily disable form: Remove from storefront without deleting
- ✅ Remove form: Completely remove form from storefront
- ✅ Clean up: Remove script before major changes
- ✅ Testing: Deactivate to test different form versions

**Important Notes:**
- ⚠️ Deactivation removes the script entirely
- ⚠️ Form data remains saved (can reactivate later)
- ⚠️ No confirmation dialog (immediate action)

---

## 2. Reset Functionality

### Purpose
Clears all form fields and resets theme to default values - provides a clean slate.

### Reset Flow

**When user clicks "Reset":**

1. **Confirmation Dialog**
   - Shows: "Are you sure you want to reset? This will clear all form fields and reset the theme to default values. This action cannot be undone."
   - Options: "Cancel" or "Reset"

2. **On Confirmation:**

   **Clears Form Fields:**
   - Removes all custom fields
   - Keeps only core required fields:
     - First Name (role: `first_name`)
     - Last Name (role: `last_name`)
     - Email (role: `email`)
     - Password (role: `password`)

   **Resets Theme:**
   - Title: "Create your account"
   - Subtitle: "Please fill in the form to continue"
   - Primary Color: `#2563eb`
   - Layout: `center`
   - Button Text: "Create account"
   - All other theme values to defaults

   **Resets State:**
   - Form name → "Unnamed"
   - Version tracking → `null`
   - Last saved state → `null`
   - Closes all open popups (field editor, theme editor, etc.)

3. **Result:**
   - Form becomes "dirty" (has unsaved changes)
   - User can start building fresh form

**Use Cases:**
- ✅ Start fresh: Clear everything and begin new design
- ✅ Remove all custom fields: Keep only core fields
- ✅ Reset theme: Restore default styling
- ✅ Clean slate: Discard all changes and start over

**Important Notes:**
- ⚠️ **Cannot be undone** - permanent action
- ⚠️ Does not affect saved versions/drafts (they remain in database)
- ⚠️ Does not deactivate form (if active, remains active)
- ⚠️ Core fields are always preserved (cannot be removed)

---

## 3. Three Save Types

### Overview
The "Save Form" button shows a dropdown with 3 options when there are unsaved changes (`isDirty = true`).

The button is:
- **Enabled** (black): When form has unsaved changes
- **Disabled** (gray): When form is clean (no changes)
- **Loading**: Shows "Saving…" during save operation

---

### 3.1 💾 Save (Main Form Save)

**Purpose:** Save to the main form storage (overwrites the primary form).

**Flow:**
1. User clicks "Save" in dropdown
2. System normalizes theme layout (validates split layout has image)
3. Ensures core fields exist (adds if missing)
4. Saves to main form storage via API (`PUT /api/store-form`)
5. **If `currentFormVersionId` exists:**
   - Updates that version's timestamp
   - Keeps version in sync with main form
6. **If form is active and script exists:**
   - Regenerates signup script with latest data
   - Updates BigCommerce script via API
7. Updates `lastSavedState` (marks form as clean/not dirty)
8. Refreshes form data from server
9. Shows success toast: "Form saved."

**Use Cases:**
- ✅ Save current work to main form
- ✅ Update primary form after making changes
- ✅ Sync changes to active script (if form is activated)
- ✅ Update version timestamp if working from a version

**Important Notes:**
- ⚠️ **Overwrites main form** - previous main form data is replaced
- ⚠️ Updates active script if form is activated
- ⚠️ Can update version timestamp if working from a version
- ⚠️ Marks form as "clean" (not dirty) after save

**When to Use:**
- When you want to commit changes to the primary form
- When you're done with changes and want to save
- When you want to update the active form on storefront

---

### 3.2 📝 Save as Draft

**Purpose:** Save current state as a draft version (does NOT overwrite main form).

**Flow:**
1. User clicks "Save as Draft" in dropdown
2. Opens modal asking for draft name:
   - **Optional** - can be left empty
   - Shows placeholder: "Enter draft name (optional)"
   - If form not "Unnamed": pre-fills with current name
3. **Name Resolution:**
   - If name provided → uses that name
   - If name empty AND form not "Unnamed" → uses current form name
   - If name empty AND form is "Unnamed" → generates "Draft [Date]"
4. Saves as version with `type: 'draft'` via API
5. Updates form name to draft name
6. Sets `currentFormVersionId` to new draft ID
7. Updates `lastSavedState` (marks form as clean)
8. Refreshes versions list
9. Shows success toast: "Draft saved successfully."

**Use Cases:**
- ✅ Save work-in-progress without affecting main form
- ✅ Create backup before major changes
- ✅ Save experimental designs
- ✅ Keep multiple draft variations
- ✅ Test different approaches

**Important Notes:**
- ⚠️ **Does NOT overwrite main form** - safe for experimentation
- ⚠️ Does NOT update active script
- ⚠️ Name is optional (auto-generated if not provided)
- ⚠️ Creates new version entry in database
- ⚠️ Updates current form name to draft name

**When to Use:**
- When experimenting with changes
- When you want to save progress without committing
- When you need multiple variations
- Before making risky changes

---

### 3.3 🏷️ Save as Version

**Purpose:** Create a named version snapshot (for milestones/releases).

**Flow:**
1. User clicks "Save as Version" in dropdown
2. Opens modal asking for version name:
   - **Required** - cannot be empty
   - Shows placeholder: "Enter version name"
   - If form not "Unnamed": pre-fills with current name
3. **Name Resolution:**
   - If name provided → uses that name
   - If name empty AND form not "Unnamed" → uses current form name
   - If name empty AND form is "Unnamed" → shows warning, requires name
4. Saves as version with `type: 'version'` via API
5. Updates form name to version name
6. Sets `currentFormVersionId` to new version ID
7. Updates `lastSavedState` (marks form as clean)
8. Refreshes versions list
9. Shows success toast: "Version saved successfully."

**Use Cases:**
- ✅ Create milestone versions (e.g., "v1.0", "Holiday 2024")
- ✅ Save stable releases
- ✅ Tag important form states
- ✅ Create rollback points
- ✅ Version control for form changes

**Important Notes:**
- ⚠️ **Name is required** - cannot be empty
- ⚠️ Does NOT overwrite main form
- ⚠️ Does NOT update active script
- ⚠️ Creates new version entry in database
- ⚠️ Typically used for stable/release versions

**When to Use:**
- When you reach a milestone
- When you want to tag a stable release
- When you need a named snapshot
- For version control and rollback points

---

## 4. Additional Flows

### 4.1 Form Name Management

**Default State:**
- New forms start as "Unnamed"
- Shows in header next to form builder

**Editing Name:**
- Click on form name to edit inline
- Enter new name and press Enter or click save
- **If editing unnamed form:**
  - Saves as new draft with that name
  - Sets `currentFormVersionId` to new draft
- **If editing named form:**
  - Updates the version name in database
  - Updates `currentFormName` in UI

**Tracking:**
- Form name tracks which version/draft is currently loaded
- Helps identify what you're working on
- Used when saving (pre-fills save modals)

---

### 4.2 Version Loading

**Versions List:**
- Shows all drafts and versions
- Displays name, type (draft/version), and timestamp
- Can delete versions from list

**Loading a Version:**
1. Click on version in versions list
2. **If form has unsaved changes:**
   - Shows confirmation modal
   - Options:
     - "Load Version" - loads but stays on current tab
     - "Load & Go to Builder" - loads and switches to Builder tab
     - "Cancel" - cancels loading
3. **If form is clean:**
   - Loads version immediately
   - Updates form fields and theme
   - Updates form name
   - Sets `currentFormVersionId`
   - Updates `lastSavedState`

**Use Cases:**
- ✅ Rollback to previous version
- ✅ Load different draft to continue work
- ✅ Compare versions
- ✅ Restore from backup

---

### 4.3 Dirty State Tracking

**What is "Dirty"?**
- Form has unsaved changes
- Current state differs from `lastSavedState`
- Compares both fields and theme

**How it Works:**
- System tracks `lastSavedState` snapshot
- Compares current fields and theme against snapshot
- Normalizes data for accurate comparison
- Updates after each save operation

**Effects of Dirty State:**
- ✅ Save button enabled (black, shows dropdown)
- ✅ Prevents loading versions (shows confirmation)
- ✅ Prevents creating new form (shows confirmation)
- ✅ Shows unsaved changes indicator

**When Form Becomes Clean:**
- After "Save" operation
- After "Save as Draft" operation
- After "Save as Version" operation
- After loading a version

---

### 4.4 Discard Changes

**When Available:**
- Only shown when form is dirty (has unsaved changes)

**Flow:**
1. User clicks "Discard Changes"
2. **If `lastSavedState` exists:**
   - Restores form fields from saved state
   - Restores theme from saved state
   - Marks form as clean
3. **If no saved state:**
   - Resets to defaults (empty form, default theme)
   - Sets form name to "Unnamed"
   - Clears version tracking

**Use Cases:**
- ✅ Undo all changes since last save
- ✅ Revert to last saved state
- ✅ Start over without saving

**Important Notes:**
- ⚠️ Does not affect saved versions
- ⚠️ Cannot be undone
- ⚠️ Only discards current session changes

---

## 5. Complete User Journey Examples

### Journey 1: First-Time Setup

**Scenario:** User is setting up form for the first time

1. User opens Form Builder
   - Form is empty/default state
   - Name shows "Unnamed"
   - Form is clean (not dirty)

2. User adds custom fields
   - Adds phone number field
   - Adds address fields
   - Configures field styling
   - Form becomes dirty

3. User customizes theme
   - Changes colors
   - Updates button text
   - Adjusts layout
   - Form remains dirty

4. User clicks "Save Form"
   - Saves to main form storage
   - Form becomes clean
   - Toast: "Form saved."

5. User clicks "Activate"
   - Script generated and added to store
   - Form goes live on storefront
   - Toast: "Form activated: [UUID]"
   - Button changes to "Deactivate"

6. User makes more changes
   - Adds new field
   - Form becomes dirty

7. User clicks "Save Form"
   - Updates main form
   - Regenerates and updates active script
   - Form becomes clean
   - Toast: "Form saved."

---

### Journey 2: Version Management

**Scenario:** User wants to experiment with different designs

1. User has working form
   - Form is active on storefront
   - Name: "Production Form"

2. User makes experimental changes
   - Changes theme colors
   - Rearranges fields
   - Form becomes dirty

3. User clicks "Save as Draft"
   - Modal opens
   - Enters name: "Experimental Design"
   - Saves as draft
   - Form name updates to "Experimental Design"
   - Toast: "Draft saved successfully."

4. User continues working
   - Makes more changes
   - Form becomes dirty again

5. User clicks "Save as Version"
   - Modal opens
   - Enters name: "v2.0 Release"
   - Saves as version
   - Form name updates to "v2.0 Release"
   - Toast: "Version saved successfully."

6. User loads "Production Form" from versions
   - Confirmation shown (form is dirty)
   - Clicks "Load Version"
   - Production form loaded
   - Can continue working on production

7. User makes final changes
   - Updates production form
   - Form becomes dirty

8. User clicks "Save Form"
   - Updates main form
   - Updates active script
   - Toast: "Form saved."

---

### Journey 3: Reset and Rebuild

**Scenario:** User wants to completely redesign the form

1. User has complex form
   - Many custom fields
   - Custom theme
   - Form is active

2. User wants to start fresh
   - Clicks "Reset"
   - Confirmation dialog appears
   - Clicks "Reset" to confirm

3. Form is reset
   - All custom fields removed
   - Only core fields remain
   - Theme reset to defaults
   - Form name: "Unnamed"
   - Form is dirty

4. User builds new form
   - Adds new fields
   - Configures new theme
   - Form remains dirty

5. User clicks "Save as Version"
   - Enters name: "Redesign v1"
   - Saves as version
   - Toast: "Version saved successfully."

6. User clicks "Activate"
   - New form goes live
   - Old form replaced
   - Toast: "Form activated: [UUID]"

---

### Journey 4: Safe Experimentation

**Scenario:** User wants to test changes safely

1. User has active form
   - Form is live on storefront
   - Name: "Current Form"

2. User makes major changes
   - Completely new design
   - New fields
   - New theme
   - Form becomes dirty

3. User clicks "Save as Draft"
   - Saves as "Test Changes"
   - Form name updates
   - Toast: "Draft saved successfully."

4. User clicks "Activate"
   - Test changes go live
   - Customers see new form
   - Toast: "Form activated: [UUID]"

5. **If issues occur:**
   - User loads previous version
   - Clicks "Activate"
   - Previous form restored

6. **If changes are good:**
   - User clicks "Save Form"
   - Commits test changes to main form
   - Toast: "Form saved."

---

## 6. State Management Summary

### Key States

| State | Type | Purpose |
|-------|------|---------|
| `isDirty` | boolean | Has unsaved changes |
| `active` | boolean | Form is activated (script exists) |
| `currentFormName` | string | Current form/version name |
| `currentFormVersionId` | string \| null | Tracks which version is loaded |
| `lastSavedState` | object \| null | Snapshot for dirty checking |
| `isSaving` | boolean | Save operation in progress |
| `isToggling` | boolean | Activate/deactivate in progress |

### State Relationships
