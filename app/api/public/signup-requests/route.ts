import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';
import { uploadSignupFile } from '@/lib/storage';

function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const publicId = String(form.get('pub') || '').trim();
      if (!publicId) return cors(NextResponse.json({ ok: false, error: 'Missing store identifier' }, { status: 400 }));
      const storeHash = await db.resolveStoreHashByPublicId(publicId);
      if (!storeHash) return cors(NextResponse.json({ ok: false, error: 'Unknown store' }, { status: 404 }));
      const ip = req.headers.get('x-forwarded-for') || null;
      const origin = req.headers.get('origin') || null;
      const userAgent = req.headers.get('user-agent') || null;
      const dataStr = String(form.get('data') || '{}');
      const email = String(form.get('email') || '').toLowerCase();
      let data: any = {};
      try { data = JSON.parse(dataStr || '{}'); } catch {}
      // Create request first (duplicate check inside)
      const created = await db.createSignupRequest(storeHash, { data, email, ip, origin, userAgent });
      // Upload files if any
      const filesMeta: Array<{ name: string; url: string; contentType?: string; size?: number; path?: string }> = [];
      for (const [key, value] of form.entries()) {
        if (key.startsWith('file__') && value && typeof value !== 'string') {
          const file = value as unknown as File;
          const ab = await file.arrayBuffer();
          const buf = Buffer.from(ab);
          const meta = await uploadSignupFile(publicId, created.id, file.name, (file as any).type || 'application/octet-stream', buf);
          filesMeta.push(meta);
        }
      }
      if (filesMeta.length) {
        await db.addSignupRequestFiles(storeHash, created.id, filesMeta);
      }
      // send signup confirmation (best-effort)
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(data);
        const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
        await trySendTemplatedEmail({
          to: email || null,
          template: templates.signup,
          vars: {
            name,
            email,
            date: new Date().toLocaleString(),
            store_name: platformName,
            platform_name: platformName,
          },
          replyTo: config?.replyTo || undefined,
          config,
        });
      } catch {}
      return cors(NextResponse.json({ ok: true, id: created.id, files: filesMeta }, { status: 200 }));
    } else {
      const body = await req.json();
      const publicId = (req.nextUrl.searchParams.get('pub') || body?.pub || '').trim();
      if (!publicId) {
        return cors(NextResponse.json({ ok: false, error: 'Missing store identifier' }, { status: 400 }));
      }
      const storeHash = await db.resolveStoreHashByPublicId(publicId);
      if (!storeHash) return cors(NextResponse.json({ ok: false, error: 'Unknown store' }, { status: 404 }));
      const ip = req.headers.get('x-forwarded-for') || null;
      const origin = req.headers.get('origin') || null;
      const userAgent = req.headers.get('user-agent') || null;
      const payload = {
        data: body?.data || {},
        email: (body?.email || '').toLowerCase() || null,
        ip,
        origin,
        userAgent,
      };
      const created = await db.createSignupRequest(storeHash, payload);
      // best-effort email
      try {
        const templates = await db.getEmailTemplates(storeHash);
        const config = await db.getEmailConfig(storeHash);
        const name = extractName(payload?.data || {});
        const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
        await trySendTemplatedEmail({
          to: payload?.email || null,
          template: templates.signup,
          vars: {
            name,
            email: payload?.email || '',
            date: new Date().toLocaleString(),
            store_name: platformName,
            platform_name: platformName,
          },
          replyTo: config?.replyTo || undefined,
          config,
        });
      } catch {}
      return cors(NextResponse.json({ ok: true, id: created.id }, { status: 200 }));
    }
  } catch (e: any) {
    const code = e?.code || '';
    if (code === 'DUPLICATE') {
      return cors(NextResponse.json({ ok: false, code: 'DUPLICATE', message: 'You have already submitted a request. Please wait for approval or contact the store admin.' }, { status: 409 }));
    }
    return cors(NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 }));
  }
}

function extractName(data: Record<string, any>) {
  const entries = Object.entries(data || {});
  // try common keys
  const candidates = ['name', 'full_name', 'full name', 'first_name', 'first name'];
  for (const key of candidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found) return String(found[1] ?? '');
  }
  // fuzzy: field containing 'name'
  const fuzzy = entries.find(([k]) => /name/i.test(k));
  if (fuzzy) return String(fuzzy[1] ?? '');
  return '';
}


