import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const versions = await db.listFormVersions(storeHash);
    
    // Ensure timestamps are properly serialized
    const serializedVersions = versions.map((v: any) => ({
      ...v,
      createdAt: v.createdAt || null,
      updatedAt: v.updatedAt || null,
    }));
    
    return NextResponse.json({ versions: serializedVersions }, { status: 200 });
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
    const { name, type, form } = body || {};
    
    if (!name || !type || !form) {
      return NextResponse.json({ message: 'Missing required fields: name, type, form' }, { status: 400 });
    }
    
    if (!['draft', 'version'].includes(type)) {
      return NextResponse.json({ message: 'Invalid type. Must be "draft" or "version"' }, { status: 400 });
    }
    
    const result = await db.saveFormVersion(storeHash, { name, type: type as any, form });
    return NextResponse.json({ ok: true, id: result.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
    const { storeHash } = session;
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get('versionId');
    
    if (!versionId) {
      return NextResponse.json({ message: 'Missing versionId' }, { status: 400 });
    }
    
    await db.deleteFormVersion(storeHash, versionId);
    return NextResponse.json({ ok: true }, { status: 200 });
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
    const { action, versionId, name, form } = body || {};
    
    if (action === 'setActive') {
      if (!versionId) {
        return NextResponse.json({ message: 'Missing versionId' }, { status: 400 });
      }
      await db.setActiveFormVersion(storeHash, versionId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    
    if (action === 'update') {
      if (!versionId) {
        return NextResponse.json({ message: 'Missing versionId' }, { status: 400 });
      }
      await db.updateFormVersion(storeHash, versionId, { name, form });
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    
    return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
  }
}

