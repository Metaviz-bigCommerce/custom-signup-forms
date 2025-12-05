import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { trySendTemplatedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Session not found' }, { status: 401 });
		const { storeHash } = session;
		const id = req.nextUrl.searchParams.get('id') || '';
		if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
		const body = await req.json();
		const requiredInformation = String(body?.required_information || '').trim();
		const request = await db.getSignupRequest(storeHash, id);
		if (!request) return NextResponse.json({ message: 'Request not found' }, { status: 404 });
		const templates = await db.getEmailTemplates(storeHash);
		const config = await db.getEmailConfig(storeHash);
		const name = extractName(request?.data || {});
		const email = request?.email || null;
		const platformName = process.env.PLATFORM_NAME || storeHash || 'Store';
		await trySendTemplatedEmail({
			to: email,
			template: templates.moreInfo,
			vars: {
				name,
				email: email || '',
				date: new Date().toLocaleString(),
				store_name: platformName,
				platform_name: platformName,
				required_information: requiredInformation || '',
			},
			replyTo: config?.replyTo || undefined,
			config,
		});
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


