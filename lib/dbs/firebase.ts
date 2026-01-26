import { initializeApp } from 'firebase/app';
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc, deleteField, addDoc, serverTimestamp, query, orderBy, limit as fsLimit, startAfter, where } from 'firebase/firestore';
import { SessionProps, UserData } from '../../types';
import type { EmailConfig, EmailTemplates } from '../email';
import { env } from '../env';

// Firebase config and initialization
// Prod applications might use config file
const firebaseConfig = {
  apiKey: env.FIRE_API_KEY,
  authDomain: env.FIRE_DOMAIN,
  projectId: env.FIRE_PROJECT_ID,
};
 
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function setUser ({ user }: SessionProps, storeHash: string) {
  if (!user || !storeHash) return null;

  const { email, id, username } = user;
  const ref = doc(db, "users", String(id));

  const docSnap = await getDoc(ref);

  if (!docSnap.exists()) {
    await setDoc(ref, { email, username, stores: [storeHash] });
  } else {
    await updateDoc(ref, { email, username: username || null, stores: arrayUnion(storeHash) });
  }
}
 
export async function setStore(session: SessionProps) {
  const {
    access_token: accessToken,
    context,
    scope,
    user: { id },
  } = session;
  // Only set on app install or update
  if (!accessToken || !scope) return null;
 
  const storeHash = context?.split('/')[1] || '';
  const ref = doc(db, 'stores', storeHash);
  const existing = await getDoc(ref);
  let publicStoreId = existing.exists() ? (existing.data()?.publicStoreId as string | undefined) : undefined;
  if (!publicStoreId) {
    publicStoreId = `pub_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
  }
  // Only set basic store info - do not create default signupForm
  // Forms should only be created when user explicitly clicks "Create New Form" in the builder
  const data: any = { accessToken, adminId: id, scope, publicStoreId };
  
  // If store doesn't exist, set basic fields. If it exists, merge to preserve signupForm
  if (existing.exists()) {
    await updateDoc(ref, { accessToken, adminId: id, scope, publicStoreId });
  } else {
    // New store - don't create signupForm, user must create it explicitly
    await setDoc(ref, { ...data, signupFormActive: false });
  }

  return ref.id;
}
 
export async function getStoreToken(storeHash: string) {
    if (!storeHash) return null;
    const storeDoc = await getDoc(doc(db, 'stores', storeHash));
 
    return storeDoc.data()?.accessToken ?? null;
}
 
export async function deleteStore(session: SessionProps) {
    const contextString = session?.context || session?.sub || '';
    const storeHash = contextString.split('/')[1] || '';

    if (!storeHash) return null;
    
    const ref = doc(db, 'stores', storeHash);
    const docSnap = await getDoc(ref);

    if (!docSnap.exists()) return null;
    
    const userId = docSnap.data()?.adminId || '';

    await deleteDoc(ref);

    return [userId, storeHash];
}

export async function deleteUser(userId: string, storeHash: string) {
  if (!userId || !storeHash) return null;

  const userRef = doc(db, 'users', String(userId));
  const userSnapBefore = await getDoc(userRef);

  if (!userSnapBefore.exists()) {
    return null;
  }

  // Ensure we’re removing the correct hash
  try {
    await updateDoc(userRef, {
      stores: arrayRemove(storeHash),
    });
  } catch (error) {
    return null;
  }

  // Wait for Firestore consistency
  await new Promise((r) => setTimeout(r, 200));

  const userSnapAfter = await getDoc(userRef);
  const dataAfter = userSnapAfter.data();

  if (!dataAfter?.stores?.length) {
    await deleteDoc(userRef);
  }
}

export async function setStoreScriptUuid(storeHash: string, uuid: string) {
  if (!storeHash) return;
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  const payload = uuid ? { signupScriptUuid: uuid } : { signupScriptUuid: deleteField() as any };
  if (!snap.exists()) await setDoc(ref, payload as any, { merge: true } as any);
  else await updateDoc(ref, payload as any);
}

export async function getStoreForm(storeHash: string) {
  if (!storeHash) return null;
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data()?.signupForm || null) : null;
}

export async function setStoreForm(storeHash: string, form: any) {
  if (!storeHash) return;
  const ref = doc(db, 'stores', storeHash);
  await setDoc(ref, { signupForm: form }, { merge: true } as any);
}

export async function setStoreFormActive(storeHash: string, active: boolean) {
  if (!storeHash) return;
  const ref = doc(db, 'stores', storeHash);
  await setDoc(ref, { signupFormActive: active }, { merge: true } as any);
}

export async function getStoreSettings(storeHash: string) {
  if (!storeHash) return null;
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    signupForm: data?.signupForm,
    signupFormActive: data?.signupFormActive ?? false,
    signupScriptUuid: data?.signupScriptUuid || '',
    emailTemplates: data?.emailTemplates || null,
    emailConfig: data?.emailConfig || null,
    cooldownPeriodDays: data?.cooldownPeriodDays ?? 7, // Default 7 days
  };
}

type SignupRequestStatus = 'pending' | 'approved' | 'rejected' | 'resubmission_requested';

export async function getPublicStoreId(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  let publicStoreId = snap.exists() ? (snap.data()?.publicStoreId as string | undefined) : undefined;
  if (!publicStoreId) {
    publicStoreId = `pub_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
    await setDoc(ref, { publicStoreId }, { merge: true } as any);
  }
  return publicStoreId;
}

export async function resolveStoreHashByPublicId(publicId: string) {
  if (!publicId) return null;
  const qy = query(collection(db, 'stores'), where('publicStoreId', '==', publicId), fsLimit(1));
  const snapshot = await getDocs(qy);
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}

export async function createSignupRequest(storeHash: string, payload: Record<string, any>) {
  if (!storeHash) throw new Error('Missing storeHash');
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  
  // Check for idempotency key first
  const idempotencyKey = payload?.idempotencyKey as string | undefined;
  if (idempotencyKey) {
    const idempotencyQ = query(colRef, where('meta.idempotencyKey', '==', idempotencyKey), fsLimit(1));
    const idempotencySnap = await getDocs(idempotencyQ);
    if (!idempotencySnap.empty) {
      // Return existing request
      const existing = idempotencySnap.docs[0];
      return { id: existing.id, existing: true };
    }
  }
  
  // Duplicate check by canonical email if provided
  const email = (payload as any)?.email ? String((payload as any).email).toLowerCase() : '';
  if (email) {
    // Check for cooldown period first
    const cooldownStatus = await checkCooldownStatus(storeHash, email);
    if (cooldownStatus.inCooldown) {
      const err: any = new Error(`cooldown_active:${cooldownStatus.remainingDays}`);
      err.code = 'COOLDOWN_ACTIVE';
      err.remainingDays = cooldownStatus.remainingDays;
      throw err;
    }
    
    // Check for existing pending/approved requests (duplicate check)
    // Note: 'resubmission_requested' is handled separately in public API (deleted before creating new)
    const dupQ = query(colRef, where('email', '==', email), fsLimit(1));
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) {
      const existing = dupSnap.docs[0].data();
      // Only block if it's pending or approved, not rejected (rejected is handled by cooldown)
      // Also allow 'resubmission_requested' (will be deleted by public API before creating new)
      if (existing.status === 'approved') {
        const err: any = new Error('account_already_exists');
        err.code = 'ACCOUNT_EXISTS';
        throw err;
      }
      if (existing.status === 'pending') {
        const err: any = new Error('duplicate_signup');
        err.code = 'DUPLICATE';
        throw err;
      }
    }
  }
  
  const docRef = await addDoc(colRef, {
    data: payload?.data || {},
    email: email || null,
    submittedAt: serverTimestamp(),
    status: 'pending' as SignupRequestStatus,
    meta: {
      userAgent: payload?.userAgent || null,
      origin: payload?.origin || null,
      ip: payload?.ip || null,
      idempotencyKey: idempotencyKey || null,
    },
  });
  return { id: docRef.id };
}

export async function listSignupRequests(storeHash: string, options?: { pageSize?: number; cursor?: string; status?: SignupRequestStatus }) {
  if (!storeHash) throw new Error('Missing storeHash');
  const { pageSize = 10, cursor, status } = options || {};
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  
  // Build base query with status filter if provided
  let q;
  if (status) {
    q = query(colRef, where('status', '==', status), orderBy('submittedAt', 'desc'));
  } else {
    q = query(colRef, orderBy('submittedAt', 'desc'));
  }
  
  // For cursor-based pagination we expect cursor to be an ISO string timestamp or Firestore Timestamp seconds
  if (cursor) {
    // We cannot directly use a string in startAfter without the document snapshot.
    // Strategy: fetch the document by id passed as cursor, then startAfter(snapshot).
    const cursorDoc = await getDoc(doc(db, 'stores', storeHash, 'signupRequests', cursor));
    if (cursorDoc.exists()) {
      // Rebuild query with cursor - need to include all constraints
      if (status) {
        q = query(colRef, where('status', '==', status), orderBy('submittedAt', 'desc'), fsLimit(pageSize), startAfter(cursorDoc));
      } else {
        q = query(colRef, orderBy('submittedAt', 'desc'), fsLimit(pageSize), startAfter(cursorDoc));
      }
    } else {
      // Cursor doc doesn't exist, just apply limit
      if (status) {
        q = query(colRef, where('status', '==', status), orderBy('submittedAt', 'desc'), fsLimit(pageSize));
      } else {
        q = query(colRef, orderBy('submittedAt', 'desc'), fsLimit(pageSize));
      }
    }
  } else {
    // No cursor, just apply limit
    if (status) {
      q = query(colRef, where('status', '==', status), orderBy('submittedAt', 'desc'), fsLimit(pageSize));
    } else {
      q = query(colRef, orderBy('submittedAt', 'desc'), fsLimit(pageSize));
    }
  }
  
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const nextCursor = snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1].id : null;
  return { items, nextCursor };
}

export async function updateSignupRequestStatus(storeHash: string, id: string, status: SignupRequestStatus) {
  if (!storeHash || !id) throw new Error('Missing storeHash or id');
  const ref = doc(db, 'stores', storeHash, 'signupRequests', id);
  const updateData: any = { status };
  
  // Store rejectedAt timestamp when status changes to 'rejected'
  if (status === 'rejected') {
    updateData.rejectedAt = serverTimestamp();
  }
  
  await updateDoc(ref, updateData);
  return { ok: true };
}

export async function updateSignupRequestForResubmission(
  storeHash: string,
  id: string,
  problematicFields: string[],
  resubmissionMessage?: string
) {
  if (!storeHash || !id) throw new Error('Missing storeHash or id');
  const ref = doc(db, 'stores', storeHash, 'signupRequests', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('Request not found');
  }
  
  const existingMeta = (snap.data() as any)?.meta || {};
  const updateData: any = {
    status: 'resubmission_requested' as SignupRequestStatus,
    meta: {
      ...existingMeta,
      problematicFields,
      resubmissionMessage: resubmissionMessage || null,
    },
  };
  
  await updateDoc(ref, updateData);
  return { ok: true };
}

export async function addSignupRequestFiles(storeHash: string, id: string, files: Array<{ name: string; url: string; contentType?: string; size?: number; path?: string }>) {
  if (!storeHash || !id) throw new Error('Missing storeHash or id');
  const ref = doc(db, 'stores', storeHash, 'signupRequests', id);
  const snap = await getDoc(ref);
  const existing = (snap.exists() ? (snap.data() as any).files : undefined) || [];
  await updateDoc(ref, { files: [...existing, ...files] });
}

export async function deleteSignupRequest(storeHash: string, id: string) {
  if (!storeHash || !id) throw new Error('Missing storeHash or id');
  const ref = doc(db, 'stores', storeHash, 'signupRequests', id);
  await deleteDoc(ref);
  return { ok: true };
}

export async function getSignupRequest(storeHash: string, id: string) {
  if (!storeHash || !id) throw new Error('Missing storeHash or id');
  const ref = doc(db, 'stores', storeHash, 'signupRequests', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

export async function findResubmissionRequestedRequest(storeHash: string, email: string) {
  if (!storeHash || !email) return null;
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  const emailLower = email.toLowerCase();
  const q = query(
    colRef,
    where('email', '==', emailLower),
    where('status', '==', 'resubmission_requested'),
    fsLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as any) };
}

// Find all rejected requests for a given email
export async function findRejectedRequestsByEmail(storeHash: string, email: string) {
  if (!storeHash || !email) return [];
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  const emailLower = email.toLowerCase();
  const q = query(
    colRef,
    where('email', '==', emailLower),
    where('status', '==', 'rejected')
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
}

export async function getEmailTemplates(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);

  // Default footer links
  const defaultFooterLinks = [
    { id: 'contact', text: 'Contact Us', url: '#' },
    { id: 'privacy', text: 'Privacy Policy', url: '#' }
  ];

  const defaults: EmailTemplates = {
    signup: {
      subject: 'Notification from {{platform_name}}: Your Signup Request Has Been Received',
      body: 'We have received your signup request and initiated the review process. Our team is currently validating the information you provided to ensure it meets our account requirements. You will receive an update once this review is complete. If any clarification or additional details are needed, we will contact you directly. Thank you for your patience while we complete this verification step.',
      useHtml: true,
      design: {
        title: 'Application Received Successfully',
        primaryColor: '#2563eb',
        background: '#f7fafc',
        ctas: [{ id: 'view-status', text: 'Check Application Status', url: '{{action_url}}' }],
        footerLinks: defaultFooterLinks
      }
    },
    approval: {
      subject: '{{platform_name}} Account Update: Your Application Has Been Approved',
      body: 'Your signup request has been approved, and your account is now active. You may now log in to begin configuring your store and accessing your dashboard. We recommend reviewing the available onboarding resources to support your initial setup. Should you need any assistance during this process, our support team is available to help. Thank you for choosing our platform for your business operations.',
      useHtml: true,
      design: {
        title: 'Welcome Aboard! You\'re Approved',
        primaryColor: '#059669',
        background: '#ecfdf5',
        ctas: [{ id: 'login', text: 'Login to Your Account', url: '{{action_url}}' }],
        footerLinks: defaultFooterLinks
      }
    },
    rejection: {
      subject: '{{platform_name}} Review Outcome: Status of Your Signup Request',
      body: 'After a thorough review of your signup information, we are unable to approve your request at this time. This decision reflects the criteria required for account activation on our platform. If you have updated information or additional context that may support reconsideration, you are welcome to reply to this email. Our team will review any new details you provide. Thank you for your interest in our services and for taking the time to apply.',
      useHtml: true,
      design: {
        title: 'Application Status Update',
        primaryColor: '#e11d48',
        background: '#fff1f2',
        ctas: [{ id: 'contact', text: 'Contact Support', url: '{{action_url}}' }],
        footerLinks: defaultFooterLinks
      }
    },
    moreInfo: {
      subject: 'Action Required from {{platform_name}}: Please Resubmit Your Signup Form',
      body: 'We need you to resubmit your signup form with corrections. Please review the highlighted fields below and resubmit your application through the signup form. Once you resubmit, we will review your updated information and proceed accordingly. If you have any questions or need clarification, please don\'t hesitate to reach out to us.',
      useHtml: true,
      design: {
        title: 'Resubmission Required',
        primaryColor: '#f59e0b',
        background: '#fffbeb',
        ctas: [{ id: 'resubmit', text: 'Resubmit Form', url: '{{action_url}}' }],
        footerLinks: defaultFooterLinks
      }
    },
    resubmissionConfirmation: {
      subject: 'Notification from {{platform_name}}: Your Resubmission Has Been Received',
      body: 'Thank you for resubmitting your signup request with the requested corrections. We have received your updated information and our team will review it shortly. You will receive an update once the review is complete. We appreciate your prompt response and cooperation.',
      useHtml: true,
      design: {
        title: 'Resubmission Received - Under Review',
        primaryColor: '#9333ea',
        background: '#faf5ff',
        ctas: [{ id: 'view-status', text: 'Check Application Status', url: '{{action_url}}' }],
        footerLinks: defaultFooterLinks
      }
    },
  };
  if (!snap.exists()) return defaults;
  const data = snap.data() as any;
  const savedTemplates = data?.emailTemplates || {};
  
  // Migrate old moreInfo template to new resubmission format
  // Also clean up any greeting from body (greeting is handled separately in design.greeting)
  if (savedTemplates.moreInfo) {
    const oldTemplate = savedTemplates.moreInfo;
    const bodyLower = (oldTemplate.body || '').toLowerCase();
    const subjectLower = (oldTemplate.subject || '').toLowerCase();
    
    // Detect old "Info Request" format - check if it doesn't mention "resubmit" or "resubmission"
    const isOldFormat = 
      subjectLower.includes('additional details needed') ||
      subjectLower.includes('additional details') ||
      (bodyLower.includes('require the following information') && !bodyLower.includes('resubmit') && !bodyLower.includes('resubmission')) ||
      oldTemplate.design?.title === 'We Need a Little More Information' ||
      (!bodyLower.includes('resubmit') && !bodyLower.includes('resubmission') && bodyLower.includes('require'));
    
    // Always remove greeting from body if present (greeting is handled separately)
    let cleanedBody = oldTemplate.body || '';
    if (cleanedBody) {
      // Remove common greeting patterns from the start of the body
      cleanedBody = cleanedBody
        .replace(/^Hi\s+\{\{name\}\},?\s*\n?/i, '')
        .replace(/^Hello\s+\{\{name\}\},?\s*\n?/i, '')
        .replace(/^Dear\s+\{\{name\}\},?\s*\n?/i, '')
        .trim();
    }
    
    if (isOldFormat) {
      // Migrate to new format - update subject and body, preserve design if it exists
      let migratedBody = defaults.moreInfo.body;
      if (cleanedBody && cleanedBody.includes('resubmit')) {
        // Body already has resubmission content, use cleaned version
        migratedBody = cleanedBody;
      }
      
      const migratedTemplate = {
        ...oldTemplate,
        subject: defaults.moreInfo.subject,
        body: migratedBody,
        design: oldTemplate.design ? {
          ...oldTemplate.design,
          title: oldTemplate.design.title === 'We Need a Little More Information' ? 'Resubmission Required' : (oldTemplate.design.title || 'Resubmission Required'),
        } : oldTemplate.design,
      };
      
      savedTemplates.moreInfo = migratedTemplate;
      
      // Save migrated template back to database (async, don't wait)
      updateDoc(ref, {
        'emailTemplates.moreInfo': migratedTemplate,
      } as any).catch(err => {
        console.error('Failed to save migrated template:', err);
      });
    } else if (cleanedBody !== oldTemplate.body) {
      // Not old format, but has greeting in body - clean it up
      const cleanedTemplate = {
        ...oldTemplate,
        body: cleanedBody,
      };
      
      savedTemplates.moreInfo = cleanedTemplate;
      
      // Save cleaned template back to database (async, don't wait)
      updateDoc(ref, {
        'emailTemplates.moreInfo': cleanedTemplate,
      } as any).catch(err => {
        console.error('Failed to save cleaned template:', err);
      });
    }
  }
  
  return { ...defaults, ...savedTemplates } as EmailTemplates;
}

export async function setEmailTemplates(storeHash: string, templates: EmailTemplates) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  await setDoc(ref, { emailTemplates: templates }, { merge: true } as any);
}

export async function getEmailConfig(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  const data = (snap.exists() ? (snap.data() as any) : {}) || {};
  const cfg: EmailConfig = {
    useShared: data?.emailConfig?.useShared ?? true,
    fromEmail: data?.emailConfig?.fromEmail || null,
    fromName: data?.emailConfig?.fromName || null,
    replyTo: data?.emailConfig?.replyTo || null,
    smtp: data?.emailConfig?.smtp || null,
  };
  return cfg;
}

export async function setEmailConfig(storeHash: string, config: EmailConfig) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  // Persist creds regardless of useShared so merchants can toggle without retyping
  const payload = {
    emailConfig: {
      useShared: config?.useShared ?? true,
      fromEmail: config?.fromEmail || null,
      fromName: config?.fromName || null,
      replyTo: config?.replyTo || null,
      smtp: config?.smtp || null,
    },
  };
  await setDoc(ref, payload as any, { merge: true } as any);
}

// Form Versions Management
export type FormVersionType = 'published' | 'draft' | 'version';

export interface FormVersion {
  id: string;
  name: string;
  type: FormVersionType;
  form: { fields: any[]; theme: any };
  createdAt: any;
  updatedAt: any;
  isActive?: boolean;
}

export async function saveFormVersion(storeHash: string, versionData: { name: string; type: FormVersionType; form: any }) {
  if (!storeHash) throw new Error('Missing storeHash');
  const colRef = collection(db, 'stores', storeHash, 'formVersions');
  const docRef = await addDoc(colRef, {
    name: versionData.name,
    type: versionData.type,
    form: versionData.form,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: false,
  });
  return { id: docRef.id };
}

export async function listFormVersions(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');
  const colRef = collection(db, 'stores', storeHash, 'formVersions');
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as FormVersion));
}

export async function getFormVersion(storeHash: string, versionId: string) {
  if (!storeHash || !versionId) throw new Error('Missing storeHash or versionId');
  const ref = doc(db, 'stores', storeHash, 'formVersions', versionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as FormVersion;
}

export async function deleteFormVersion(storeHash: string, versionId: string) {
  if (!storeHash || !versionId) throw new Error('Missing storeHash or versionId');
  const ref = doc(db, 'stores', storeHash, 'formVersions', versionId);
  await deleteDoc(ref);
  return { ok: true };
}

export async function setActiveFormVersion(storeHash: string, versionId: string) {
  if (!storeHash || !versionId) throw new Error('Missing storeHash or versionId');
  
  // Get the version
  const version = await getFormVersion(storeHash, versionId);
  if (!version) throw new Error('Version not found');
  
  // Update main signupForm
  await setStoreForm(storeHash, version.form);
  
  // Set signupFormActive=true (form is being activated)
  await setStoreFormActive(storeHash, true);
  
  // Set all versions to inactive, then set this one as active
  const allVersions = await listFormVersions(storeHash);
  for (const v of allVersions) {
    const vRef = doc(db, 'stores', storeHash, 'formVersions', v.id);
    await updateDoc(vRef, { isActive: v.id === versionId, updatedAt: serverTimestamp() });
  }
  
  return { ok: true };
}

export async function updateFormVersion(storeHash: string, versionId: string, updates: { name?: string; form?: any }) {
  if (!storeHash || !versionId) throw new Error('Missing storeHash or versionId');
  const ref = doc(db, 'stores', storeHash, 'formVersions', versionId);
  const updateData: any = { updatedAt: serverTimestamp() };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.form !== undefined) updateData.form = updates.form;
  await updateDoc(ref, updateData);
  return { ok: true };
}

export async function deactivateAllVersions(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');

  // Set all versions to inactive
  const allVersions = await listFormVersions(storeHash);
  const updatePromises = allVersions.map((v) => {
    const vRef = doc(db, 'stores', storeHash, 'formVersions', v.id);
    return updateDoc(vRef, { isActive: false, updatedAt: serverTimestamp() });
  });

  await Promise.all(updatePromises);
  return { ok: true };
}

/**
 * Check if a form with the given name already exists in the formVersions collection.
 * @param storeHash - The store identifier
 * @param name - The form name to check
 * @param excludeVersionId - Optional version ID to exclude from the check (for updates)
 * @returns true if a form with the same name exists, false otherwise
 */
export async function checkFormNameExists(
  storeHash: string,
  name: string,
  excludeVersionId?: string
): Promise<boolean> {
  if (!storeHash || !name) return false;

  const colRef = collection(db, 'stores', storeHash, 'formVersions');
  const q = query(colRef, where('name', '==', name.trim()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  // If excludeVersionId is provided, check if the only match is the excluded version
  if (excludeVersionId) {
    const matchingDocs = snapshot.docs.filter((doc) => doc.id !== excludeVersionId);
    return matchingDocs.length > 0;
  }

  return true;
}

// Cooldown period configuration
export async function getCooldownPeriod(storeHash: string): Promise<number> {
  if (!storeHash) throw new Error('Missing storeHash');
  const settings = await getStoreSettings(storeHash);
  return settings?.cooldownPeriodDays ?? 7; // Default 7 days
}

export async function setCooldownPeriod(storeHash: string, days: number): Promise<void> {
  if (!storeHash) throw new Error('Missing storeHash');
  if (days < 1 || days > 365) throw new Error('Cooldown period must be between 1 and 365 days');
  const ref = doc(db, 'stores', storeHash);
  await setDoc(ref, { cooldownPeriodDays: days }, { merge: true } as any);
}

// Check cooldown status for an email
export async function checkCooldownStatus(storeHash: string, email: string): Promise<{ inCooldown: boolean; remainingDays?: number }> {
  if (!storeHash || !email) {
    return { inCooldown: false };
  }
  
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  const emailLower = email.toLowerCase();
  
  // Query for rejected requests by this email (we'll filter and sort in memory if needed)
  // First, get all rejected requests for this email
  const rejectedQ = query(
    colRef,
    where('email', '==', emailLower),
    where('status', '==', 'rejected'),
    orderBy('submittedAt', 'desc'),
    fsLimit(10) // Get recent rejections to find one with rejectedAt
  );
  
  const rejectedSnap = await getDocs(rejectedQ);
  
  if (rejectedSnap.empty) {
    return { inCooldown: false };
  }
  
  // Find the most recent rejection with a rejectedAt timestamp
  let mostRecentRejection: { rejectedAt: any } | null = null;
  for (const doc of rejectedSnap.docs) {
    const data = doc.data();
    if (data.rejectedAt) {
      mostRecentRejection = { rejectedAt: data.rejectedAt };
      break; // Since we ordered by submittedAt desc, first one with rejectedAt is most recent
    }
  }
  
  if (!mostRecentRejection || !mostRecentRejection.rejectedAt) {
    // No rejection with timestamp found, allow resubmission
    return { inCooldown: false };
  }
  
  const rejectedAt = mostRecentRejection.rejectedAt;
  
  // Get cooldown period
  const cooldownDays = await getCooldownPeriod(storeHash);
  
  // Convert Firestore timestamp to Date
  let rejectedDate: Date;
  if (rejectedAt && typeof rejectedAt === 'object' && 'toDate' in rejectedAt) {
    rejectedDate = rejectedAt.toDate();
  } else if (rejectedAt && typeof rejectedAt === 'object' && 'seconds' in rejectedAt) {
    rejectedDate = new Date((rejectedAt.seconds as number) * 1000);
  } else if (rejectedAt instanceof Date) {
    rejectedDate = rejectedAt;
  } else {
    return { inCooldown: false };
  }
  
  // Calculate time difference
  const now = new Date();
  const diffMs = now.getTime() - rejectedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays >= cooldownDays) {
    return { inCooldown: false };
  }
  
  // Calculate remaining days (round up)
  const remainingDays = Math.ceil(cooldownDays - diffDays);
  return { inCooldown: true, remainingDays };
}

// Reset cooldown for a specific email (remove rejectedAt from most recent rejection)
export async function resetCooldownForEmail(storeHash: string, email: string): Promise<void> {
  if (!storeHash || !email) throw new Error('Missing storeHash or email');
  
  const colRef = collection(db, 'stores', storeHash, 'signupRequests');
  const emailLower = email.toLowerCase();
  
  // Find most recent rejected request with rejectedAt
  const rejectedQ = query(
    colRef,
    where('email', '==', emailLower),
    where('status', '==', 'rejected'),
    orderBy('submittedAt', 'desc'),
    fsLimit(10)
  );
  
  const rejectedSnap = await getDocs(rejectedQ);
  
  // Find the most recent rejection with rejectedAt
  for (const rejectedDoc of rejectedSnap.docs) {
    const data = rejectedDoc.data();
    if (data.rejectedAt) {
      const ref = doc(db, 'stores', storeHash, 'signupRequests', rejectedDoc.id);
      // Remove rejectedAt to effectively reset the cooldown
      await updateDoc(ref, { rejectedAt: deleteField() as any });
      return;
    }
  }
}

// ============================================================================
// Notification Configuration
// ============================================================================

export async function getNotificationConfig(storeHash: string): Promise<{ enabled: boolean; notifyEmail: string | null }> {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  const data = snap.exists() ? (snap.data() as any) : {};
  return {
    enabled: data?.notificationConfig?.enabled ?? true, // Default: enabled
    notifyEmail: data?.notificationConfig?.notifyEmail || null,
  };
}

export async function setNotificationConfig(storeHash: string, config: { enabled: boolean; notifyEmail: string | null }): Promise<void> {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  await setDoc(ref, {
    notificationConfig: {
      enabled: Boolean(config.enabled),
      notifyEmail: config.notifyEmail || null,
    }
  }, { merge: true } as any);
}

// Get store owner email for notifications
export async function getStoreOwnerEmail(storeHash: string): Promise<string | null> {
  if (!storeHash) return null;

  // 1. Get notification config first (check for custom email)
  const notificationConfig = await getNotificationConfig(storeHash);
  if (!notificationConfig.enabled) {
    return null; // Notifications disabled
  }

  // 2. If custom notification email is set, use it
  if (notificationConfig.notifyEmail && notificationConfig.notifyEmail.trim()) {
    return notificationConfig.notifyEmail.trim();
  }

  // 3. Otherwise, get store owner's email from users collection
  const storeRef = doc(db, 'stores', storeHash);
  const storeSnap = await getDoc(storeRef);
  if (!storeSnap.exists()) return null;

  const storeData = storeSnap.data();
  const adminId = storeData?.adminId;
  if (!adminId) return null;

  // 4. Fetch user document
  const userRef = doc(db, 'users', String(adminId));
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;

  const userData = userSnap.data();
  return userData?.email || null;
}