import nodemailer from 'nodemailer';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo';

export type EmailTemplate = {
	subject: string;
	body: string;
	html?: string | null;
	useHtml?: boolean | null;
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

export type EmailSmtpConfig = {
	host: string;
	port: number;
	user: string;
	pass: string;
	secure?: boolean;
};

export type EmailConfig = {
	fromEmail?: string | null;
	fromName?: string | null;
	replyTo?: string | null;
	useShared?: boolean | null;
	// If provided, we use this transporter instead of the shared one
	smtp?: EmailSmtpConfig | null;
};

const transportCache = new Map<string, nodemailer.Transporter>();

function getCustomTransporter(smtp?: EmailSmtpConfig | null) {
	if (!smtp || !smtp.user || !smtp.pass) return null;
	const key = `${smtp.host}:${smtp.port}:${smtp.user}`;
	if (transportCache.has(key)) return transportCache.get(key)!;
	const t = nodemailer.createTransport({
		host: smtp.host,
		port: smtp.port,
		secure: smtp.secure ?? smtp.port === 465,
		auth: { user: smtp.user, pass: smtp.pass },
	});
	transportCache.set(key, t);
	return t;
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
	replyTo?: string;
	config?: EmailConfig | null;
	html?: string | null;
}) {
	const { to, subject, body, from, replyTo, config, html } = params;
	// choose transporter (tenant or shared)
	const tenantTransporter = config && config.useShared === false
		? getCustomTransporter(config?.smtp || null)
		: null;
	const activeTransporter = tenantTransporter || transporter;
	// Soft no-op if not configured
	if (!activeTransporter) {
		console.warn('[email] SMTP not configured; skipping email send to', to);
		return { ok: false, skipped: true };
	}
	try {
		const fromName = (config?.fromName || '').trim() || undefined;
		const usingCustomSmtp = Boolean(
			!config?.useShared &&
			config?.smtp &&
			(config.smtp as any).user &&
			(config.smtp as any).pass
		);
		// If using shared SMTP, force DEFAULT_FROM (ignore config.fromEmail to avoid unauthorized domain issues)
		const resolvedFromEmail = usingCustomSmtp
			? (config?.fromEmail || from || DEFAULT_FROM).trim()
			: (from || DEFAULT_FROM).trim();
		const fromEmail = resolvedFromEmail || DEFAULT_FROM;
		const prettyFrom = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
		await activeTransporter.sendMail({
			from: prettyFrom,
			to: Array.isArray(to) ? to.join(',') : to,
			subject,
			text: body,
			html: html || undefined,
			replyTo: replyTo || config?.replyTo || undefined,
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
	replyTo?: string;
	config?: EmailConfig | null;
}) {
	const { to, template, vars, from, replyTo, config } = args;
	if (!to) return { ok: false, skipped: true };
	const subject = renderTemplate(template.subject, vars);
	const body = renderTemplate(template.body, vars);
	const html = template?.useHtml ? renderTemplate(String(template?.html || ''), vars) : null;
	return await sendEmail({ to, subject, body, html, from, replyTo, config });
}


