import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
		const { storeHash } = session;
		const templates = await db.getEmailTemplates(storeHash);
		return NextResponse.json({ templates }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
		const { storeHash } = session;
		const { templates } = await req.json();
		if (!templates) return NextResponse.json({ message: 'Missing templates' }, { status: 400 });
		await db.setEmailTemplates(storeHash, templates);
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
	}
}


