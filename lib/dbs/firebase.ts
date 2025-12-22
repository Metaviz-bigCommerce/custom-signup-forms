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
  const defaultForm = {
    fields: [
      { id: 1, type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true, labelColor: '#1f2937', labelSize: '14', labelWeight: '500', borderColor: '#d1d5db', borderWidth: '1', borderRadius: '6', bgColor: '#ffffff', padding: '10', fontSize: '14', textColor: '#1f2937' },
      { id: 2, type: 'email', label: 'Email', placeholder: 'Enter your email', required: true, labelColor: '#1f2937', labelSize: '14', labelWeight: '500', borderColor: '#d1d5db', borderWidth: '1', borderRadius: '6', bgColor: '#ffffff', padding: '10', fontSize: '14', textColor: '#1f2937' },
      { id: 3, type: 'phone', label: 'Phone', placeholder: 'Enter your phone', required: false, labelColor: '#1f2937', labelSize: '14', labelWeight: '500', borderColor: '#d1d5db', borderWidth: '1', borderRadius: '6', bgColor: '#ffffff', padding: '10', fontSize: '14', textColor: '#1f2937' }
    ],
    theme: {
      title: 'Create your account',
      subtitle: 'Please fill in the form to continue',
      primaryColor: '#2563eb',
      layout: 'split', // split | center
      splitImageUrl: '',
      buttonText: 'Create account',
      buttonBg: '#2563eb',
      buttonColor: '#ffffff',
      buttonRadius: 10
    }
  };
  const data = { accessToken, adminId: id, scope, signupForm: defaultForm, signupFormActive: false, publicStoreId };
 
  await setDoc(ref, data);

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
  };
}

type SignupRequestStatus = 'pending' | 'approved' | 'rejected';

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
    const dupQ = query(colRef, where('email', '==', email), fsLimit(1));
    const dupSnap = await getDocs(dupQ);
    if (!dupSnap.empty) {
      const err: any = new Error('duplicate_signup');
      err.code = 'DUPLICATE';
      throw err;
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
  await updateDoc(ref, { status });
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

export async function getEmailTemplates(storeHash: string) {
  if (!storeHash) throw new Error('Missing storeHash');
  const ref = doc(db, 'stores', storeHash);
  const snap = await getDoc(ref);
  const defaults: EmailTemplates = {
    signup: {
      subject: 'Notification from {{platform_name}}: Your Signup Request Has Been Received',
      body:
        'Hi {{name}},\nWe have received your signup request and initiated the review process. Our team is currently validating the information you provided to ensure it meets our account requirements. You will receive an update once this review is complete.',
    },
    approval: {
      subject: '{{platform_name}} Account Update: Your Application Has Been Approved',
      body:
        'Hi {{name}},\nYour signup request has been approved, and your account is now active. You may now log in to begin configuring your store.',
    },
    rejection: {
      subject: '{{platform_name}} Review Outcome: Status of Your Signup Request',
      body:
        'Hi {{name}},\nAfter a thorough review of your signup information, we are unable to approve your request at this time.',
    },
    moreInfo: {
      subject: 'Action Required from {{platform_name}}: Additional Details Needed to Proceed',
      body:
        'Hi {{name}},\nTo proceed with your signup review, we require the following information: {{required_information}}.',
    },
  };
  if (!snap.exists()) return defaults;
  const data = snap.data() as any;
  return { ...defaults, ...(data?.emailTemplates || {}) } as EmailTemplates;
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