---
name: Dynamic Form Configuration Fetch
overview: Convert the static script to dynamically fetch form configuration based on the pub parameter, ensuring each merchant sees their own form instead of the last activated form.
todos:
  - id: create-form-config-api
    content: Create /api/public/form-config endpoint that returns active form config by pub parameter
    status: pending
  - id: add-db-method
    content: Add database method to get active form version by storeHash
    status: pending
  - id: modify-script-generation
    content: Modify generate-signup-script to create generic script that fetches config dynamically
    status: pending
    dependencies:
      - create-form-config-api
  - id: update-script-logic
    content: Update generated script to hide default form immediately (prevent glitch), extract pub parameter, fetch form config from API, and restore default form on error with graceful error handling
    status: pending
    dependencies:
      - create-form-config-api
      - modify-script-generation
  - id: update-activation-flow
    content: Update activation flow to ensure pub parameter is included in script URL
    status: pending
  - id: test-multi-merchant
    content: Test that multiple merchants see their own forms correctly
    status: pending
    dependencies:
      - create-form-config-api
      - modify-script-generation
      - update-script-logic
---

# Dynamic

Form Configuration Fetch

## Problem

Currently, all merchants share a single static script file (`custom-signup.min.js`) that embeds form data at generation time. When any merchant activates a form, it overwrites the file, causing all merchants to see the last activated form.

## Solution

Modify the script to fetch form configuration dynamically from an API endpoint using the `pub` parameter, instead of embedding form data in the script.

## Implementation Steps

### 1. Create Public Form Config API Endpoint

- **File**: `app/api/public/form-config/route.ts`
- **Purpose**: Return active form configuration for a store based on `pub` parameter
- **Returns**: `{ fields, theme, containerId, countryData }` for the active form
- **Security**: Validate `pub` parameter and resolve to `storeHash`, check if form is active

### 2. Modify Script Generation

- **File**: `app/api/generate-signup-script/route.ts`
- **Changes**: 
- Remove form data embedding (fields, theme, countryData)
- Generate a generic script that fetches config from `/api/public/form-config?pub=xxx`
- Script extracts `pub` from its own script tag URL
- Add error handling for failed config fetch

### 3. Update Script Logic

- **File**: `public/custom-signup.min.js` (generated)
- **Changes**:
- **Immediate default form hiding**: Hide default BigCommerce form elements IMMEDIATELY on script load (before fetching config) to prevent visual glitch
- Extract `pub` parameter from script tag URL on load
- Show loading spinner/state while fetching config
- Fetch form config from API endpoint
- **On success**: Render custom form (default form already hidden, no glitch)
- **On error**: 
- Log all errors to console for debugging
- Restore/show the default BigCommerce form elements
- Allow the merchant's default signup form to display normally
- Ensure page remains functional
- Cache config if needed (optional optimization)

### 4. Update Activation Flow

- **File**: `components/VersionsList.tsx`
- **Changes**: 
- Remove or simplify script generation step (script is now generic)
- Ensure `pub` parameter is included in script URL when embedding in BigCommerce
- Verify script URL includes `?pub=xxx` parameter

### 5. Database Query Method

- **File**: `lib/db.ts` (or `lib/dbs/firebase.ts`)
- **Purpose**: Add method to get active form version by `storeHash`
- **Returns**: Form fields, theme, and other config for the active version

### 6. Implement Graceful Error Handling

- **File**: `app/api/generate-signup-script/route.ts` (script generation)
- **Purpose**: Ensure script fails gracefully without breaking the merchant's store, while preventing visual glitches
- **Implementation**:
- **Immediate hide**: Call `hideAllContent()` IMMEDIATELY on script load (before any async operations) to prevent default form from showing
- Show loading spinner immediately
- Wrap entire script execution in try-catch block
- On any error (fetch failure, parsing error, rendering error):
    - Log detailed error to console: `console.error('custom-signup error:', error)`
    - **Restore default form**: Re-show default BigCommerce form elements (reverse the hide operation)
    - Remove loading spinner
    - Allow default signup form to display normally
    - Exit script execution cleanly
- Add error logging at each critical step:
    - Config fetch failures
    - JSON parsing errors
    - Form rendering errors
    - DOM manipulation errors
- **Key principle**: Hide default form immediately to prevent glitch, but have a restore mechanism if custom form fails

## Technical Details

### API Endpoint Structure

```javascript
GET /api/public/form-config?pub={publicStoreId}
Response: {
  ok: true,
  data: {
    fields: FormField[],
    theme: Theme,
    containerId: string,
    countryData: CountryData[]
  }
}
```



### Script Flow

1. Script loads and immediately hides default BigCommerce form elements (prevents visual glitch)
2. Shows loading spinner/state
3. Extracts `pub` from `document.currentScript.src`
4. Fetches `/api/public/form-config?pub={pub}`
5. **On success**: 

- Renders custom form with fetched config
- Default form already hidden, no glitch visible

6. **On error**: 

- Logs error to console with details
- Restores/shows default BigCommerce form elements
- Allows default BigCommerce signup form to display normally
- Ensures page remains functional

### Error Handling

- **Initial state**: Hide default form immediately on script load to prevent visual glitch
- Missing `pub` parameter: Log error to console, restore default form visibility, allow default form to show
- Invalid `pub`: API returns 404, log error to console, restore default form visibility, allow default form to show
- No active form: API returns empty/null, log info to console, restore default form visibility, allow default form to show
- Network error: Log error to console, restore default form visibility, allow default form to show (no retry to avoid blocking)
- Script execution errors: Wrap entire script in try-catch, log errors to console, restore default form visibility
- **Critical**: Hide default form immediately to prevent glitch, but restore it if custom form fails to load. If any step fails after initial hide, default form should be restored and remain visible and functional.

## Benefits

- Each merchant sees their own form