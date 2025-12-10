"use client";
import useSWR from "swr";
import { useSession } from "../context/session";

async function fetcher([url, encodedContext]: [string, string]) {
  const res = await fetch(`${url}?context=${encodedContext}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}, ${await res.text()}`);
  }
  const json = await res.json();
  
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
      throw new Error(`Failed to add script: ${res.status} ${await res.text()}`);
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
      throw new Error(`Failed to add script: ${res.status} ${await res.text()}`);
    }
    return res.json();
  };

  const deleteScript = async (script_uuid: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/bc-scripts?script_uuid=${script_uuid}&context=${encodedContext}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to delete script: ${res.status} ${await res.text()}`);
    }
    return res.json();
  };

  return { addScript, updateScript, deleteScript };
} 

export function useStoreForm() {
  const encodedContext = useSession()?.context;
  const { data, error, mutate } = useSWR(
    encodedContext ? ["/api/store-form", encodedContext] : null,
    fetcher
  );
  return {
    form: data?.form,
    active: data?.active,
    scriptUuid: data?.scriptUuid,
    isError: error,
    mutate,
  };
}

export function useStoreFormActions() {
  const encodedContext = useSession()?.context;
  const saveForm = async (form: any) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/store-form?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form }),
    });
    if (!res.ok) throw new Error(`Failed to save form: ${res.status} ${await res.text()}`);
    return res.json();
  };
  const setActive = async (active: boolean) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/store-form?context=${encodedContext}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: active ? 'activate' : 'deactivate' }),
    });
    if (!res.ok) throw new Error(`Failed to set active: ${res.status} ${await res.text()}`);
    return res.json();
  };
  return { saveForm, setActive };
}

export function useFormVersions() {
  const encodedContext = useSession()?.context;
  const { data, error, mutate } = useSWR(
    encodedContext ? ["/api/form-versions", encodedContext] : null,
    fetcher
  );
  return {
    versions: data?.versions || [],
    isError: error,
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
    if (!res.ok) throw new Error(`Failed to save version: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return { ...data, id: data.id }; // Ensure id is returned
  };
  
  const loadVersion = async (versionId: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    // Fetch all versions and find the one we need
    const versionsRes = await fetch(`/api/form-versions?context=${encodedContext}`);
    if (!versionsRes.ok) throw new Error(`Failed to fetch versions: ${versionsRes.status}`);
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
    if (!res.ok) throw new Error(`Failed to delete version: ${res.status} ${await res.text()}`);
    return res.json();
  };
  
  const setActiveVersion = async (versionId: string) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setActive', versionId }),
    });
    if (!res.ok) throw new Error(`Failed to set active version: ${res.status} ${await res.text()}`);
    return res.json();
  };
  
  const updateVersion = async (versionId: string, updates: { name?: string; form?: any }) => {
    if (!encodedContext) throw new Error("Missing BigCommerce session context");
    const res = await fetch(`/api/form-versions?context=${encodedContext}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', versionId, ...updates }),
    });
    if (!res.ok) throw new Error(`Failed to update version: ${res.status} ${await res.text()}`);
    return res.json();
  };
  
  return { saveAsVersion, loadVersion, deleteVersion, setActiveVersion, updateVersion };
}