import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { isSmtpConfigured, type EmailConfig } from '@/lib/email';

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
		const config: EmailConfig = body?.config;
		if (!config) return NextResponse.json({ message: 'Missing config' }, { status: 400 });
		
		// Validate SMTP configuration if provided
		if (config.smtp) {
			const { host, port, user, pass } = config.smtp;
			if (!host?.trim() || !port || !user?.trim() || !pass?.trim()) {
				return NextResponse.json({ 
					message: 'SMTP configuration is incomplete. All fields (host, port, user, pass) are required.' 
				}, { status: 400 });
			}
			
			// Validate port is a number
			if (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
				return NextResponse.json({ 
					message: 'SMTP port must be a valid number between 1 and 65535.' 
				}, { status: 400 });
			}
		}
		
		// If customerEmailsEnabled is true, SMTP must be configured
		if (config.customerEmailsEnabled && !isSmtpConfigured(config)) {
			return NextResponse.json({ 
				message: 'SMTP must be fully configured to enable customer emails.' 
			}, { status: 400 });
		}
		
		// If SMTP is configured, fromEmail is required
		if (isSmtpConfigured(config) && !config.fromEmail?.trim()) {
			return NextResponse.json({ 
				message: 'From Email is required when SMTP is configured.' 
			}, { status: 400 });
		}
		
		// Ensure useShared is always false (deprecated)
		config.useShared = false;
		
		await db.setEmailConfig(storeHash, config);
		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ message: e?.message || 'Unknown error' }, { status: 500 });
	}
}


