import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';

function extractEmail(data: Record<string, any>, topLevelEmail?: string | null): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // First check top-level email
  if (topLevelEmail && typeof topLevelEmail === 'string' && topLevelEmail.trim()) {
    const trimmed = topLevelEmail.trim();
    if (emailRegex.test(trimmed)) {
      return trimmed.toLowerCase();
    }
  }
  
  // Search in data object
  const entries = Object.entries(data || {});
  
  // Normalize key for comparison - remove all non-alphanumeric and convert to lowercase
  const normalize = (k: string) => String(k || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // List of candidate field names (normalized)
  const candidates = ['email', 'emailaddress', 'useremail', 'contactemail', 'primaryemail', 'workemail'];
  
  // Try exact matches first
  for (const key of candidates) {
    const found = entries.find(([k]) => normalize(k) === key);
    if (found && found[1]) {
      const val = String(found[1]).trim();
      if (val && emailRegex.test(val)) {
        return val.toLowerCase();
      }
    }
  }
  
  // Fuzzy search: any field containing 'email' or 'e-mail' or 'mail'
  const fuzzy = entries.find(([k, v]) => {
    const nk = normalize(k);
    if (!nk.includes('email') && !nk.includes('mail')) return false;
    // Exclude fields like "email_verified", "email_opt_in", etc.
    if (nk.includes('verif') || nk.includes('opt') || nk.includes('subscri') || nk.includes('confirm')) return false;
    const val = String(v ?? '').trim();
    return val && emailRegex.test(val);
  });
  if (fuzzy) return String(fuzzy[1]).trim().toLowerCase();
  
  // Last resort: scan all values for something that looks like an email
  for (const [k, v] of entries) {
    if (typeof v === 'string') {
      const val = v.trim();
      if (val && emailRegex.test(val)) {
        // Found an email-like value - use it
        console.log(`[Approve] Found email in field "${k}":`, val);
        return val.toLowerCase();
      }
    }
  }
  
  return '';
}

function extractName(data: Record<string, any>) {
  const entries = Object.entries(data || {});
  
  // Normalize key for comparison - remove all non-alphanumeric and convert to lowercase
  const normalize = (k: string) => String(k || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Priority list of normalized field names to check (for full name fields)
  const fullNameCandidates = ['fullname', 'name', 'customername', 'applicantname', 'contactname', 'displayname'];
  
  // First, try to find a full name field
  for (const key of fullNameCandidates) {
    const found = entries.find(([k]) => normalize(k) === key);
    if (found && found[1]) {
      const val = String(found[1]).trim();
      if (val) {
        console.log(`[Approve] Found full name in field "${found[0]}":`, val);
        return val;
      }
    }
  }
  
  // Try to combine first_name and last_name if both exist
  const firstNameEntry = entries.find(([k]) => {
    const nk = normalize(k);
    return nk === 'firstname' || nk === 'first' || nk === 'givenname' ||
           (nk.includes('first') && nk.includes('name'));
  });
  const lastNameEntry = entries.find(([k]) => {
    const nk = normalize(k);
    return nk === 'lastname' || nk === 'last' || nk === 'surname' || nk === 'familyname' ||
           (nk.includes('last') && nk.includes('name')) || 
           (nk.includes('sur') && nk.includes('name'));
  });
  
  const firstName = firstNameEntry ? String(firstNameEntry[1] ?? '').trim() : '';
  const lastName = lastNameEntry ? String(lastNameEntry[1] ?? '').trim() : '';
  
  if (firstName || lastName) {
    const combined = [firstName, lastName].filter(Boolean).join(' ');
    console.log(`[Approve] Combined name from first/last:`, combined);
    return combined;
  }
  
  // Fuzzy search: find any field containing 'name' but not company/business
  const fuzzy = entries.find(([k, v]) => {
    const nk = normalize(k);
    if (!nk.includes('name')) return false;
    // Exclude company/business names and email-related
    if (nk.includes('company') || nk.includes('business') || nk.includes('organiz') || 
        nk.includes('firm') || nk.includes('brand') || nk.includes('email') ||
        nk.includes('user')) return false;
    const val = String(v ?? '').trim();
    return val.length > 0;
  });
  if (fuzzy) {
    console.log(`[Approve] Found name via fuzzy match in field "${fuzzy[0]}":`, fuzzy[1]);
    return String(fuzzy[1]).trim();
  }
  
  return '';
}

const disallowedKeyPattern = /(doc|document|file|upload|picture|image|photo|attachment|form|b\s*form|certificate|license|id|proof|registration|tax)/i;
const fileLikeValuePattern = /\.(png|jpe?g|gif|webp|pdf|docx?|xlsx?|zip|rar)$/i;

function isPlausibleTextValue(v: unknown): boolean {
  const s = String(v ?? '').trim();
  if (!s) return false;
  if (s.length > 512) return false; // avoid long blobs/base64
  if (/https?:\/\//i.test(s)) return false;
  if (s.includes('/') || s.includes('\\')) return false;
  if (fileLikeValuePattern.test(s)) return false;
  return true;
}

function getFieldValue(
  data: Record<string, any>,
  exactKeys: string[],
  includeRegex: RegExp,
  preferWord?: string
): string {
  const entries = Object.entries(data || {});
  const norm = (k: string) => k.trim().toLowerCase();

  // 1) Try exact keys first
  for (const key of exactKeys) {
    const found = entries.find(([k]) => norm(k) === norm(key));
    if (found && !disallowedKeyPattern.test(found[0]) && isPlausibleTextValue(found[1])) {
      return String(found[1] ?? '');
    }
  }

  // 2) Fuzzy include with filters
  const fuzzyCandidates = entries
    .filter(([k, v]) => includeRegex.test(k) && !disallowedKeyPattern.test(k) && isPlausibleTextValue(v))
    .map(([k, v]) => ({ key: k, value: String(v ?? '') }));

  if (!fuzzyCandidates.length) return '';

  // Prefer the one whose key contains preferWord (e.g., "name") else pick the shortest key
  if (preferWord) {
    const preferred = fuzzyCandidates.find(c => new RegExp(preferWord, 'i').test(c.key));
    if (preferred) return preferred.value;
  }
  return fuzzyCandidates.sort((a, b) => a.key.length - b.key.length)[0].value;
}

// Note: BigCommerce form_fields must match actual custom fields defined in the store
// Sending arbitrary fields will cause a 422 error, so we skip form_fields for now
function toFormFields(data: Record<string, any>): Array<{ name: string; value: string }> {
  // Return empty array - form_fields should only contain fields that are
  // configured as custom customer fields in BigCommerce admin
  return [];
}

function splitName(full: string, data?: Record<string, any>): { first_name: string; last_name: string } {
  const s = (full || '').trim();
  
  // Normalize key for comparison - remove all non-alphanumeric and convert to lowercase
  const normalize = (k: string) => String(k || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // First, try to get explicit first_name and last_name from data
  if (data) {
    const entries = Object.entries(data);
    
    const firstNameEntry = entries.find(([k]) => {
      const nk = normalize(k);
      // Match: firstname, first_name, first name, first, givenname, etc.
      return nk === 'firstname' || nk === 'first' || nk === 'givenname' ||
             (nk.includes('first') && nk.includes('name'));
    });
    const lastNameEntry = entries.find(([k]) => {
      const nk = normalize(k);
      // Match: lastname, last_name, last name, surname, familyname, etc.
      return nk === 'lastname' || nk === 'last' || nk === 'surname' || nk === 'familyname' ||
             (nk.includes('last') && nk.includes('name')) || 
             (nk.includes('sur') && nk.includes('name')) ||
             (nk.includes('family') && nk.includes('name'));
    });
    
    const explicitFirst = firstNameEntry ? String(firstNameEntry[1] ?? '').trim() : '';
    const explicitLast = lastNameEntry ? String(lastNameEntry[1] ?? '').trim() : '';
    
    console.log(`[Approve] Explicit first name found: "${explicitFirst}" from key: "${firstNameEntry?.[0]}"`);
    console.log(`[Approve] Explicit last name found: "${explicitLast}" from key: "${lastNameEntry?.[0]}"`);
    
    if (explicitFirst || explicitLast) {
      return {
        first_name: explicitFirst || (s ? s.split(/\s+/)[0] : 'Customer'),
        last_name: explicitLast || 'User',
      };
    }
  }
  
  // Fall back to splitting the full name
  if (!s) return { first_name: 'Customer', last_name: 'User' };
  
  const parts = s.split(/\s+/).filter(p => p.length > 0);
  if (parts.length === 0) {
    return { first_name: 'Customer', last_name: 'User' };
  }
  if (parts.length === 1) {
    // Only one name provided - use it as first name and set a placeholder for last name
    return { first_name: parts[0], last_name: 'User' };
  }
  
  return { 
    first_name: parts.slice(0, -1).join(' '), 
    last_name: parts.slice(-1).join(' ') 
  };
}

function extractCountryCode(data: Record<string, any>): string {
  const raw = getFieldValue(
    data,
    ['country_code', 'country code', 'country'],
    /country|country_code|country code|country name/i
  ).trim();
  if (!raw) return '';
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const key = raw.toLowerCase().trim();
  const MAP: Record<string, string> = {
    'united states': 'US',
    usa: 'US',
    us: 'US',
    'united kingdom': 'GB',
    uk: 'GB',
    'great britain': 'GB',
    canada: 'CA',
    australia: 'AU',
    india: 'IN',
    pakistan: 'PK',
    germany: 'DE',
    france: 'FR',
    spain: 'ES',
    italy: 'IT',
    'united arab emirates': 'AE',
    uae: 'AE',
  };
  return MAP[key] || '';
}

function extractAddress(
  data: Record<string, any>,
  defaults: { first_name?: string; last_name?: string; phone?: string; company?: string }
): any | null {
  const address1 = getFieldValue(
    data,
    ['address1', 'address 1', 'address_line_1', 'address line 1', 'street', 'street1', 'street 1', 'line1', 'line 1'],
    /address(\s*line)?\s*1|street|line\s*1/i
  );
  const address2 = getFieldValue(
    data,
    ['address2', 'address 2', 'address_line_2', 'address line 2', 'street2', 'street 2', 'line2', 'line 2', 'suite', 'apt', 'apartment', 'unit'],
    /address(\s*line)?\s*2|street\s*2|line\s*2|suite|apt|apartment|unit/i
  );
  const city = getFieldValue(data, ['city', 'town'], /city|town/i);
  const state_or_province = getFieldValue(
    data,
    ['state_or_province', 'state', 'province', 'region'],
    /state|province|region/i
  );
  const postal_code = getFieldValue(
    data,
    ['postal_code', 'postal code', 'zip', 'zip_code'],
    /(postal|zip)/i
  );
  const country_code = extractCountryCode(data);

  const first_name = getFieldValue(
    data,
    ['address_first_name', 'address first name', 'shipping_first_name', 'billing_first_name'],
    /first(\s*name)?/i
  ) || defaults.first_name || '';
  const last_name = getFieldValue(
    data,
    ['address_last_name', 'address last name', 'shipping_last_name', 'billing_last_name'],
    /last(\s*name)?/i
  ) || defaults.last_name || '';

  // Required by BC: first_name, last_name, address1, city, country_code
  if (!first_name || !last_name || !address1 || !city || !country_code) {
    return null;
  }

  const addr: any = {
    address1,
    ...(address2 ? { address2 } : {}),
    address_type: 'residential',
    city,
    company: defaults.company || undefined,
    country_code,
    first_name,
    last_name,
    phone: defaults.phone || undefined,
    postal_code: postal_code || undefined,
    state_or_province: state_or_province || undefined,
  };
  // Remove undefined keys
  Object.keys(addr).forEach((k) => (addr[k] === undefined || addr[k] === '') && delete addr[k]);
  return addr;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { accessToken, storeHash } = session;

    const body = await req.json();
    const id = String(body?.id || '');
    const customer_group_id = body?.customer_group_id ? Number(body.customer_group_id) : undefined;
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

    const request = await db.getSignupRequest(storeHash, id);
    if (!request) return NextResponse.json({ message: 'Request not found' }, { status: 404 });

    // Extract email - check both top-level and in data object
    const email = extractEmail(request?.data || {}, request?.email);
    const fullName = extractName(request?.data || {});
    const { first_name, last_name } = splitName(fullName, request?.data || {});
    const form_fields = toFormFields(request?.data || {});
    
    // Debug logging for troubleshooting
    console.log('[Approve] Request data:', JSON.stringify(request?.data, null, 2));
    console.log('[Approve] Top-level email:', request?.email);
    console.log('[Approve] Extracted email:', email);
    console.log('[Approve] Full name:', fullName);
    console.log('[Approve] First name:', first_name);
    console.log('[Approve] Last name:', last_name);
    const phone = getFieldValue(
      request?.data || {},
      ['phone', 'phone_number', 'mobile', 'mobile_number', 'contact_number'],
      /phone|mobile|contact/i
    );
    const company = getFieldValue(
      request?.data || {},
      ['company', 'company_name', 'company name', 'business', 'business_name', 'business name', 'organization', 'organisation', 'brand', 'firm'],
      /company|business|organiza|brand|firm/i,
      'name'
    );
    const password = getFieldValue(
      request?.data || {},
      ['password', 'pwd'],
      /pass(word)?|pwd/i
    );

    if (!email) {
      return NextResponse.json({ message: 'Cannot create customer: email is missing in request' }, { status: 400 });
    }

    // Create BC customer (v3 Customers API)
    const createUrl = `https://api.bigcommerce.com/stores/${storeHash}/v3/customers`;
    const baseCustomer: any = {
      email,
      first_name,
      last_name,
      ...(customer_group_id ? { customer_group_id } : {}),
      // Only include form_fields if there are actual custom fields configured
      ...(form_fields.length > 0 ? { form_fields } : {}),
      ...(phone ? { phone } : {}),
      ...(company ? { company } : {}),
    };
    const addr = extractAddress(request?.data || {}, { first_name, last_name, phone, company });
    if (addr) {
      baseCustomer.addresses = [addr];
    }

    // Attempt 1: include password if provided
    const initialPayload: any[] = [
      password ? { ...baseCustomer, authentication: { new_password: password } } : baseCustomer,
    ];

    let createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'X-Auth-Token': String(accessToken),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initialPayload),
    });
    let createData = await createRes.json();
    if (!createRes.ok) {
      // If duplicate email, treat as success for our flow
      if (createRes.status === 409) {
        // continue
      } else if (createRes.status === 422 && password) {
        // Likely password policy violation or other validation; retry without password
        const retryPayload: any[] = [baseCustomer];
        createRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'X-Auth-Token': String(accessToken),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(retryPayload),
        });
        createData = await createRes.json();
        if (!createRes.ok && createRes.status !== 409) {
          let msg = 'Failed to create customer';
          if (createData?.errors && typeof createData.errors === 'object' && !Array.isArray(createData.errors)) {
            const errorMessages = Object.entries(createData.errors)
              .map(([field, error]) => `${field}: ${error}`)
              .join('; ');
            if (errorMessages) msg = errorMessages;
          } else if (Array.isArray(createData?.errors)) {
            msg = createData.errors.join(', ');
          } else if (createData?.message) {
            msg = createData.message;
          } else if (createData?.title) {
            msg = createData.title;
          }
          console.error('BigCommerce customer creation failed (retry):', JSON.stringify(createData, null, 2));
          return NextResponse.json({ message: msg }, { status: createRes.status });
        }
      } else {
        // Extract detailed error message from BigCommerce response
        let msg = 'Failed to create customer';
        if (createData?.errors && typeof createData.errors === 'object') {
          // Handle object-style errors like { "email": "error message" }
          const errorMessages = Object.entries(createData.errors)
            .map(([field, error]) => `${field}: ${error}`)
            .join('; ');
          if (errorMessages) msg = errorMessages;
        } else if (Array.isArray(createData?.errors)) {
          msg = createData.errors.join(', ');
        } else if (createData?.message) {
          msg = createData.message;
        } else if (createData?.title) {
          msg = createData.title;
        }
        console.error('BigCommerce customer creation failed:', JSON.stringify(createData, null, 2));
        return NextResponse.json({ message: msg }, { status: createRes.status });
      }
    }

    // Mark request approved
    await db.updateSignupRequestStatus(storeHash, id, 'approved');

    // Send approval email (mirror existing behavior)
    try {
      const templates = await db.getEmailTemplates(storeHash);
      const config = await db.getEmailConfig(storeHash);
      const platformName = env.PLATFORM_NAME || storeHash || 'Store';
      await trySendTemplatedEmail({
        to: email,
        template: templates.approval,
        vars: {
          name: fullName,
          email: email || '',
          date: new Date().toLocaleString(),
          store_name: platformName,
          platform_name: platformName,
        },
        replyTo: config?.replyTo || undefined,
        config,
      });
    } catch {}

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}


