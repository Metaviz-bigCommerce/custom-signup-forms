import { SessionProps } from './auth';
 
export interface StoreData {
    accessToken?: string;
    scope?: string;
    storeHash: string;
}
 
export interface UserData {
    email: string;
    username?: string;
    stores?: string[];
}
 
export interface Db {
    setUser(session: SessionProps, storeHash: string): Promise<null | undefined>;
    setStore(session: SessionProps): Promise<null | undefined>;
    getStoreToken(storeHash: string): Promise<any>;
    deleteStore(session: SessionProps): Promise<[string, string] | null | undefined>;
    deleteUser(userId: string, storeHash: string): Promise<null | undefined>;
    setStoreScriptUuid(storeHash: string, uuid: string): Promise<void>;
    getStoreForm(storeHash: string): Promise<any>;
    setStoreForm(storeHash: string, form: any): Promise<void>;
    setStoreFormActive(storeHash: string, active: boolean): Promise<void>;
    getStoreSettings(storeHash: string): Promise<{ signupForm?: any; signupFormActive?: boolean; signupScriptUuid?: string; emailTemplates?: any } | null>;
    getPublicStoreId(storeHash: string): Promise<string>;
    resolveStoreHashByPublicId(publicId: string): Promise<string | null>;
    createSignupRequest(storeHash: string, payload: Record<string, any>): Promise<{ id: string }>;
    listSignupRequests(storeHash: string, options?: { pageSize?: number; cursor?: string; status?: 'pending' | 'approved' | 'rejected' }): Promise<{ items: any[]; nextCursor: string | null }>;
    updateSignupRequestStatus(storeHash: string, id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ ok: boolean }>;
    deleteSignupRequest(storeHash: string, id: string): Promise<{ ok: boolean }>;
    addSignupRequestFiles(storeHash: string, id: string, files: Array<{ name: string; url: string; contentType?: string; size?: number; path?: string }>): Promise<void>;
    getSignupRequest(storeHash: string, id: string): Promise<any | null>;
    getEmailTemplates(storeHash: string): Promise<any>;
    setEmailTemplates(storeHash: string, templates: any): Promise<void>;
    getEmailConfig(storeHash: string): Promise<any>;
    setEmailConfig(storeHash: string, config: any): Promise<void>;
    saveFormVersion(storeHash: string, versionData: { name: string; type: 'published' | 'draft' | 'version'; form: any }): Promise<{ id: string }>;
    listFormVersions(storeHash: string): Promise<any[]>;
    getFormVersion(storeHash: string, versionId: string): Promise<any | null>;
    deleteFormVersion(storeHash: string, versionId: string): Promise<{ ok: boolean }>;
    setActiveFormVersion(storeHash: string, versionId: string): Promise<{ ok: boolean }>;
    updateFormVersion(storeHash: string, versionId: string, updates: { name?: string; form?: any }): Promise<{ ok: boolean }>;
    deactivateAllVersions(storeHash: string): Promise<{ ok: boolean }>;
}