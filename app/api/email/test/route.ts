import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';
import { env } from '@/lib/env';

export async function POST(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
		const { storeHash } = session;
		const body = await req.json().catch(() => ({}));
		const to = String(body?.to || '').trim();
		const key = String(body?.key || 'signup') as 'signup' | 'approval' | 'rejection' | 'moreInfo';
		if (!to) return NextResponse.json({ message: 'Missing to' }, { status: 400 });
		const templates = await db.getEmailTemplates(storeHash);
		const config = await db.getEmailConfig(storeHash);
		const t = (templates as any)?.[key];
		if (!t) return NextResponse.json({ message: 'Unknown template' }, { status: 400 });
		const platformName = env.PLATFORM_NAME || storeHash || 'Store';
		const res = await trySendTemplatedEmail({
			to,
			template: t,
			vars: {
				name: 'Test User',
				email: to,
				date: new Date().toLocaleString(),
				store_name: platformName,
				platform_name: platformName,
				required_information: 'N/A',
				action_url: 'https://example.com',
			},
			replyTo: config?.replyTo || undefined,
			config,
			templateKey: key,
		});
		return NextResponse.json({ ok: true, result: res }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
	}
}


