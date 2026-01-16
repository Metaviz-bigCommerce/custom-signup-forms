import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

		const { storeHash } = session;
		const config = await db.getNotificationConfig(storeHash);

		return NextResponse.json({ config }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ message: error?.message || 'Unknown error' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getSession(req);
		if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

		const { storeHash } = session;
		const body = await req.json();
		const { config } = body;

		// Validate email if provided
		if (config.notifyEmail && config.notifyEmail.trim()) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(config.notifyEmail.trim())) {
				return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
			}
		}

		await db.setNotificationConfig(storeHash, {
			enabled: Boolean(config.enabled),
			notifyEmail: config.notifyEmail?.trim() || null,
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ message: error?.message || 'Unknown error' }, { status: 500 });
	}
}
