import nodemailer from 'nodemailer';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo';

export type EmailTemplate = {
	subject: string;
	body: string;
};

export type EmailTemplates = Record<TemplateKey, EmailTemplate>;

const DEFAULT_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
const SMTP_HOST = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = Number(process.env.BREVO_SMTP_PORT || 587);
const SMTP_USER = process.env.BREVO_SMTP_USER || '';
const SMTP_PASS = process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS || '';

let transporter: nodemailer.Transporter | null = null;
if (SMTP_USER && SMTP_PASS) {
	transporter = nodemailer.createTransport({
		host: SMTP_HOST,
		port: SMTP_PORT,
		secure: SMTP_PORT === 465,
		auth: { user: SMTP_USER, pass: SMTP_PASS },
	});
}

export function renderTemplate(input: string, vars: Record<string, string | number | null | undefined>) {
	return String(input || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
		const v = vars?.[key];
		return v == null ? '' : String(v);
	});
}

export async function sendEmail(params: {
	to: string | string[];
	subject: string;
	body: string;
	from?: string;
}) {
	const { to, subject, body, from } = params;
	// Soft no-op if not configured
	if (!transporter) {
		console.warn('[email] SMTP not configured; skipping email send to', to);
		return { ok: false, skipped: true };
	}
	try {
		await transporter.sendMail({
			from: from || DEFAULT_FROM,
			to: Array.isArray(to) ? to.join(',') : to,
			subject,
			text: body,
		});
		return { ok: true };
	} catch (e) {
		console.error('[email] send failed', e);
		return { ok: false };
	}
}

export async function trySendTemplatedEmail(args: {
	to?: string | null;
	template: EmailTemplate;
	vars: Record<string, any>;
	from?: string;
}) {
	const { to, template, vars, from } = args;
	if (!to) return { ok: false, skipped: true };
	const subject = renderTemplate(template.subject, vars);
	const body = renderTemplate(template.body, vars);
	return await sendEmail({ to, subject, body, from });
}


