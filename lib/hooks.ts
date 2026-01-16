"use client";
import useSWR from "swr";
import { useSession } from "../context/session";

async function fetcher([url, encodedContext]: [string, string]) {
  const res = await fetch(`${url}?context=${encodedContext}`);
  if (!res.ok) {
    const errorText = await res.text();
    // Throw a clean error message (components will sanitize further if needed)
    throw new Error(errorText || 'Unable to load data. Please refresh the page.');
  }
  const json = await res.json();
  
  // Handle new standardized response format
  if (json && typeof json === 'object') {
    if (json.error === false && json.data) {
      return json.data;
    }
    // If it's an error response, throw
    if (json.error === true) {
      throw new Error(json.message || 'API error');
    }
  }
  
  // Fallback to old format for backward compatibility
  return json;
}


export function useProducts() {
  const encodedContext = useSession()?.context;
  console.log('encodedContext:', encodedContext);

  const { data, error } = useSWR(
    encodedContext ? ["/api/products", encodedContext] : null,
    fetcher
  );

  return {
    summary: data?.data,
    isError: error,
  };
}

export function useBcScriptsActions() {
  const encodedContext = useSession()?.context;
  console.log('encodedContext:', encodedContext);

  const addScript = async (payload: unknown) => {
    if (!encodedContext) {
      throw new Error("Missing BigCommerce session context");
    }
    const res = await fetch(`/api/bc-scripts?context=${encodedContext}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to add script. Please try again.');
    }
    console.log('addScript res:', res);
    return res.json();
  };

  const updateScript = async (script_uuid: string, payload: unknown) => {
    if (!encodedContext) {
      throw new Error("Missing BigCommerce session context");
    }
    const res = await fetch(`/api/bc-scripts?script_uuid=${script_uuid}&context=${encodedContext}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to add script. Please try again.');
    }
    return res.json();
  };

  const deleteScript = async (script_uuid: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks.ts:79',message:'deleteScript entry',data:{script_uuid,hasContext:!!encodedContext},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const url = `/api/bc-scripts?script_uuid=${script_uuid}&context=${encodedContext}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks.ts:82',message:'Before fetch DELETE',data:{url,script_uuid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    const res = await fetch(url, {
      method: "DELETE",
    });
    // #region agent log
    const responseText = await res.text();
    fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks.ts:87',message:'After fetch DELETE',data:{status:res.status,statusText:res.statusText,ok:res.ok,responseText:responseText.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D,E'})}).catch(()=>{});
    // #endregion
    if (!res.ok) {
      throw new Error(responseText || 'Unable to delete script. Please try again.');
    }
    // DELETE operations often return 204 No Content with empty body - this is success
    // For 204, responseText will be empty, and we should treat that as success
    // Return a success indicator object instead of empty object to avoid false error detection
    if (res.status === 204 || !responseText || !responseText.trim()) {
      // 204 No Content or empty response = success
      return { success: true, deleted: true };
    }
    
    // If there's a response body, try to parse it
    let jsonResult: { success: boolean; deleted?: boolean; [key: string]: any } = { success: true };
    try {
      jsonResult = { ...JSON.parse(responseText), success: true };
    } catch (parseError) {
      // If JSON parse fails but status is ok, treat as success
      jsonResult = { success: true, deleted: true };
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b3c94d70-e835-4b4f-8871-5704bb869a70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'hooks.ts:102',message:'deleteScript returning',data:{jsonResult,responseTextLength:responseText?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,D'})}).catch(()=>{});
    // #endregion
    return jsonResult;
  };

  return { addScript, updateScript, deleteScript };
} 

export function useStoreForm() {
  const encodedContext = useSession()?.context;
  const { data, error, mutate, isLoading } = useSWR(
    encodedContext ? ["/api/store-form", encodedContext] : null,
    fetcher
  );
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development' && data !== undefined) {
    console.log('[useStoreForm] Data received:', { 
      hasData: !!data, 
      hasForm: !!data?.form, 
      active: data?.active,
      scriptUuid: data?.scriptUuid,
      formKeys: data?.form ? Object.keys(data.form) : [] 
    });
  }
  
  return {
    form: data?.form !== undefined ? data.form : undefined, // Keep undefined while loading, null when loaded but no form
    active: data?.active || false,
    scriptUuid: data?.scriptUuid || '',
    isError: error,
    isLoading,
    mutate,
  };
}

export function useStoreFormActions() {
  const encodedContext = useSession()?.context;
  const saveForm = async (form: any, versionName?: string, saveType?: 'draft' | 'version') => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const body: Record<string, unknown> = { form };
    if (versionName) body.versionName = versionName;
    if (saveType) body.saveType = saveType;
    const res = await fetch(`/api/store-form?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let errorMessage = 'Unable to save form. Please try again.';
      try {
        const errorData = await res.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // If JSON parsing fails, use default message
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };
  const setActive = async (active: boolean) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/store-form?context=${encodedContext}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: active ? 'activate' : 'deactivate' }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to update form status. Please try again.');
    }
    return res.json();
  };
  return { saveForm, setActive };
}

export function useFormVersions() {
  const encodedContext = useSession()?.context;
  const { data, error, mutate, isLoading } = useSWR(
    encodedContext ? ["/api/form-versions", encodedContext] : null,
    fetcher
  );
  return {
    versions: data?.versions || data || [],
    isError: error,
    isLoading,
    mutate,
  };
}

export function useFormVersionActions() {
  const encodedContext = useSession()?.context;
  
  const saveAsVersion = async (name: string, type: 'draft' | 'version', form: any) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, form }),
    });
    if (!res.ok) {
      let errorMessage = 'Unable to save version. Please try again.';
      try {
        const errorData = await res.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // If JSON parsing fails, use default message
      }
      throw new Error(errorMessage);
    }
    const data = await res.json();
    return { ...data, id: data.id }; // Ensure id is returned
  };
  
  const loadVersion = async (versionId: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    // Fetch all versions and find the one we need
    const versionsRes = await fetch(`/api/form-versions?context=${encodedContext}`);
    if (!versionsRes.ok) {
      throw new Error('Unable to load form versions. Please refresh the page.');
    }
    const versionsData = await versionsRes.json();
    const version = versionsData.versions?.find((v: any) => v.id === versionId);
    if (!version) throw new Error('Version not found');
    return version;
  };
  
  const deleteVersion = async (versionId: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}&versionId=${versionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to delete version. Please try again.');
    }
    return res.json();
  };
  
  const setActiveVersion = async (versionId: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setActive', versionId }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to activate version. Please try again.');
    }
    return res.json();
  };
  
  const updateVersion = async (versionId: string, updates: { name?: string; form?: any }) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', versionId, ...updates }),
    });
    if (!res.ok) {
      let errorMessage = 'Unable to update version. Please try again.';
      try {
        const errorData = await res.json();
        if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // If JSON parsing fails, use default message
      }
      throw new Error(errorMessage);
    }
    return res.json();
  };

  const deactivateAllVersions = async () => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivateAll' }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Unable to deactivate versions. Please try again.');
    }
    return res.json();
  };
  
  return { saveAsVersion, loadVersion, deleteVersion, setActiveVersion, updateVersion, deactivateAllVersions };
}