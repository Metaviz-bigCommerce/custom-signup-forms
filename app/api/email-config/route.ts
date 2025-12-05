import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
		const { storeHash } = session;
		const cfg = await db.getEmailConfig(storeHash);
		return NextResponse.json({ config: cfg }, { status: 200 });
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
		const config = body?.config;
		if (!config) return NextResponse.json({ message: 'Missing config' }, { status: 400 });
		await db.setEmailConfig(storeHash, config);
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
	}
}


