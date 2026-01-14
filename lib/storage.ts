import { put, del } from '@vercel/blob';

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

export async function deleteSignupRequestFiles(files: Array<{ path?: string; url?: string }>) {
  if (!files || files.length === 0) return;
  
  const deletePromises = files
    .filter(file => file.url)
    .map(async (file) => {
      try {
        if (file.url) {
          await del(file.url);
        }
      } catch (error) {
        // Log error but don't throw - continue deleting other files
        console.error('Failed to delete file:', file.url, error);
      }
    });
  
  await Promise.all(deletePromises);
}


