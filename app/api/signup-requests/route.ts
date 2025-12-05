import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { trySendTemplatedEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const pageSize = Number(req.nextUrl.searchParams.get('pageSize') || '10');
    const cursor = req.nextUrl.searchParams.get('cursor') || undefined;
    const statusParam = (req.nextUrl.searchParams.get('status') || '') as 'pending' | 'approved' | 'rejected' | '';
    const status = statusParam || undefined;
    const result = await db.listSignupRequests(storeHash, { pageSize, cursor, status: status as any });
    return NextResponse.json({ items: result.items, nextCursor: result.nextCursor }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    await db.deleteSignupRequest(storeHash, id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    const body = await req.json();
    const status = body?.status as 'pending' | 'approved' | 'rejected';
    if (!status) return NextResponse.json({ message: 'Missing status' }, { status: 400 });
    await db.updateSignupRequestStatus(storeHash, id, status);
    // best-effort email to user
    try {
      const request = await db.getSignupRequest(storeHash, id);
      const templates = await db.getEmailTemplates(storeHash);
      const config = await db.getEmailConfig(storeHash);
      const name = extractName(request?.data || {});
      const email = request?.email || null;
      const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
      const template = status === 'approved' ? templates.approval : status === 'rejected' ? templates.rejection : null;
      if (template) {
        await trySendTemplatedEmail({
          to: email,
          template,
          vars: {
            name,
            email: email || '',
            date: new Date().toLocaleString(),
            store_name: platformName,
            platform_name: platformName,
          },
          replyTo: config?.replyTo || undefined,
          config,
        });
      }
    } catch {}
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

function extractName(data: Record<string, any>) {
  const entries = Object.entries(data || {});
  const candidates = ['name', 'full_name', 'full name', 'first_name', 'first name'];
  for (const key of candidates) {
    const found = entries.find(([k]) => k.toLowerCase() === key);
    if (found) return String(found[1] ?? '');
  }
  const fuzzy = entries.find(([k]) => /name/i.test(k));
  if (fuzzy) return String(fuzzy[1] ?? '');
  return '';
}


