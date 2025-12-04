import { put } from '@vercel/blob';

export async function uploadSignupFile(publicStoreId: string, requestId: string, fileName: string, contentType: string, buffer: Buffer) {
  const safeName = String(fileName || 'file').replace(/[^\w.\-]+/g, '_');
  const objectPath = `signup-requests/${publicStoreId}/${requestId}/${Date.now()}-${safeName}`;
  const blob = await put(objectPath, buffer, {
    access: 'public',
    contentType: contentType || 'application/octet-stream',
  } as any);
  return {
    name: safeName,
    path: objectPath,
    url: blob.url,
    contentType: (blob as any).contentType || contentType || 'application/octet-stream',
    size: buffer.length,
  };
}


