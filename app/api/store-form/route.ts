import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const settings = await db.getStoreSettings(storeHash);
    return NextResponse.json({ 
      form: settings?.signupForm || null, 
      active: settings?.signupFormActive || false, 
      scriptUuid: settings?.signupScriptUuid || '' 
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const body = await req.json();
    const { form, versionName, saveType } = body || {};
    
    // If versionName and saveType are provided, save as version/draft
    if (versionName && saveType && (saveType === 'draft' || saveType === 'version')) {
      await db.saveFormVersion(storeHash, {
        name: versionName,
        type: saveType as 'draft' | 'version',
        form: form || {}
      });
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    
    // Otherwise, save to main form (backward compatible)
    if (!form) {
      return NextResponse.json({ message: 'Missing form data' }, { status: 400 });
    }
    await db.setStoreForm(storeHash, form);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const body = await req.json();
    const action = body?.action as 'activate' | 'deactivate';
    if (action === 'activate') {
      await db.setStoreFormActive(storeHash, true);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    if (action === 'deactivate') {
      await db.setStoreFormActive(storeHash, false);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

