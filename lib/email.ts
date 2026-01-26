import nodemailer from 'nodemailer';
import { env } from './env';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo' | 'resubmissionConfirmation';

// Notification templates for store owners (not exposed in UI)
type NotificationTemplateKey = 'ownerNewSignup' | 'ownerResubmission';

export type EmailTemplateDesign = {
	logoUrl?: string;
	bannerUrl?: string;
	primaryColor?: string;
	background?: string;
	title?: string;
	greeting?: string;
	ctas?: Array<{ id: string; text: string; url: string }>;
	footerNote?: string;
	footerLinks?: Array<{ id: string; text: string; url: string }>;
	socialLinks?: Array<{ id: string; name: string; url: string; iconUrl: string }>;
};

export type EmailTemplate = {
	subject: string;
	body: string;
	html?: string | null;
	useHtml?: boolean | null;
	design?: EmailTemplateDesign | null;
};

export type EmailTemplates = Record<TemplateKey, EmailTemplate>;

// Internal notification templates (hardcoded, not in Firestore)
const NOTIFICATION_TEMPLATES: Record<NotificationTemplateKey, EmailTemplate> = {
	ownerNewSignup: {
		subject: 'New Signup Request Received - {{name}}',
		body: `You have received a new signup request from a customer. This request is now pending your review and requires action.

Please review this request in your dashboard and take appropriate action. You can <span style="color:#059669;font-weight:700;">approve</span> the request, <span style="color:#dc2626;font-weight:700;">reject</span> it, or <span style="color:#3b82f6;font-weight:700;">Request Resubmission</span> from the applicant.`,
		design: {
			title: 'New Signup Request',
			greeting: 'Hello there,',
			primaryColor: '#059669', // Green color for new requests
			background: '#f0fdf4', // Light green background
		}
	},
	ownerResubmission: {
		subject: 'Signup Request Resubmitted - {{name}}',
		body: `{{name}} has resubmitted their signup request with the corrections you requested. The updated information is now available for your review.

Please review the updated information in your dashboard. The applicant has made changes based on your feedback and is waiting for your approval.`,
		design: {
			title: 'Request Resubmitted',
			greeting: 'Dear Store Owner,',
			primaryColor: '#f59e0b', // Amber color for resubmissions
			background: '#fffbeb', // Light amber background
		}
	}
};

const DEFAULT_FROM = env.EMAIL_FROM || 'no-reply@example.com';
const COMPANY_REPLY_TO = env.EMAIL_REPLY_TO || env.EMAIL_FROM || 'no-reply@example.com';
const COMPANY_FROM_NAME = env.EMAIL_FROM_NAME || undefined;
const SMTP_HOST = env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = Number(env.BREVO_SMTP_PORT || 587);
const SMTP_USER = env.BREVO_SMTP_USER || '';
const SMTP_PASS = env.BREVO_SMTP_KEY || env.BREVO_SMTP_PASS || '';

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
	useShared?: boolean | null; // Deprecated - kept for backward compatibility
	// If provided, we use this transporter instead of the shared one
	smtp?: EmailSmtpConfig | null;
	// New field to track if customer emails are enabled
	customerEmailsEnabled?: boolean | null;
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

// Helper function to validate SMTP configuration
export function isSmtpConfigured(config?: EmailConfig | null): boolean {
	if (!config?.smtp) return false;
	const { host, port, user, pass } = config.smtp;
	return !!(host?.trim() && port && user?.trim() && pass?.trim());
}

export function renderTemplate(input: string, vars: Record<string, string | number | null | undefined>) {
	return String(input || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
		const v = vars?.[key];
		return v == null ? '' : String(v);
	});
}

// Default titles per template type
const defaultTitles: Record<TemplateKey, string> = {
	signup: 'Application Received Successfully',
	approval: 'Welcome Aboard! You\'re Approved',
	rejection: 'Application Status Update',
	moreInfo: 'We Need a Little More Information',
	resubmissionConfirmation: 'Resubmission Received - Under Review'
};

// Generate HTML email from template with actual user variables
export function generateEmailHtml(template: EmailTemplate, vars: Record<string, string | number | null | undefined>, templateKey: TemplateKey): string {
	const d = template.design || {};
	const brand = d.primaryColor || '#2563eb';
	const bg = d.background || '#f7fafc';
	const platformName = String(vars.platform_name || vars.store_name || 'Store');
	
	const logo = d.logoUrl 
		? `<img src="${d.logoUrl}" alt="${platformName}" style="max-width:200px;height:auto;display:block;margin:0 auto">` 
		: `<div style="font-size:32px;font-weight:900;letter-spacing:.3px;color:${brand};text-align:center">${platformName}</div>`;
	
	const banner = d.bannerUrl 
		? `<tr><td style="padding:0 24px 8px 24px"><img src="${d.bannerUrl}" alt="" style="width:100%;height:auto;border-radius:14px;display:block"></td></tr>` 
		: '';
	
	// Generate CTAs row - exclude CTAs for moreInfo template (users reply via email)
	const ctas = (templateKey === 'moreInfo') ? [] : (d.ctas || []);
	const ctasRow = ctas.length > 0
		? `<tr>
				<td align="center" style="padding:20px 24px 16px 24px">
					${ctas.map(cta => `<a href="${renderTemplate(cta.url, vars)}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:800;letter-spacing:.2px;padding:13px 24px;border-radius:999px;margin:4px 6px"> ${cta.text} </a>`).join('')}
				</td>
			</tr>`
		: '';
	
	// Generate social links row
	const socialLinks = d.socialLinks || [];
	const socialsRow = socialLinks.length > 0
		? `<tr><td align="center" style="padding-top:8px;padding-bottom:8px">
				<table role="presentation" cellspacing="0" cellpadding="0" border="0">
					<tr>
						${socialLinks.map(social => `<td style="padding:0 6px"><a href="${social.url}" target="_blank"><img src="${social.iconUrl}" alt="${social.name}" style="width:24px;height:24px;border-radius:4px;display:block" /></a></td>`).join('')}
					</tr>
				</table>
			</td></tr>`
		: '';
	
	// Generate footer links row
	const footerLinks = d.footerLinks || [];
	const footerLinksHtml = footerLinks.length > 0
		? footerLinks.map(link => `<a href="${link.url}" style="color:${brand};text-decoration:underline">${link.text}</a>`).join(' &nbsp;|&nbsp; ')
		: '';
	
	const footerNote = d.footerNote || 'This email was sent to {{email}}';
	const heading = renderTemplate(d.title || defaultTitles[templateKey] || platformName, vars);
	const greeting = renderTemplate(d.greeting || 'Hello {{name}}', vars);

	// For moreInfo template, format required_information in an eye-catching way
	let bodyText = renderTemplate(template.body, vars);
	let bodyContent: string;
	
	if (templateKey === 'moreInfo' && vars.required_information) {
		const requiredInfo = String(vars.required_information || '').trim();
		const merchantMessage = String(vars.merchant_message || '').trim();
		if (requiredInfo) {
			// Remove the {{required_information}} placeholder from body text (merchant_message is only shown in the box)
			// Also clean up common patterns
			bodyText = bodyText
				.replace(/\{\{\s*required_information\s*\}\}/g, '')
				.replace(/\{\{\s*merchant_message\s*\}\}/g, '') // Remove from body, only show in box
				.replace(/\.\s*\./g, '.') // Fix double periods ".." -> "."
				.replace(/:\s*\./g, '.') // Fix "information: ." -> "information."
				.replace(/\s+/g, ' ') // Normalize whitespace
				.trim();
			
			// Escape HTML in the required info text
			const escapeHtml = (text: string) => {
				return text
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#039;');
			};
			
			// Format problematic fields - split by comma and create a list
			const fieldsList = requiredInfo.split(',').map(f => f.trim()).filter(f => f);
			const formattedFields = fieldsList.map(field => {
				const escaped = escapeHtml(field);
				return `<div style="font-size:16px;line-height:1.8;color:#0f172a;font-weight:500;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin-bottom:8px;">${escaped}</div>`;
			}).join('');
			
			// Use orange color for resubmission request (matching the design)
			const orangeColor = '#d97706'; // Amber/orange color
			const orangeRgb = { r: 217, g: 119, b: 6 };
			const bgColor = `rgba(${orangeRgb.r}, ${orangeRgb.g}, ${orangeRgb.b}, 0.1)`;
			const borderColor = orangeColor;
			
			const infoBox = `
				<tr>
					<td style="padding:16px 24px 24px 24px;">
						<div style="background:${bgColor};border:2px solid ${borderColor};border-radius:16px;padding:24px;margin:16px 0;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
							<div style="display:flex;gap:16px;align-items:flex-start;">
								<div style="flex-shrink:0;width:20px;height:20px;background:${orangeColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px ${orangeColor}50;margin:2px 16px 0 0;">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<circle cx="12" cy="12" r="10" fill="#ffffff"/>
									</svg>
								</div>
								<div style="flex:1;">
									<div style="font-size:12px;font-weight:800;color:${orangeColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">FIELDS REQUIRING CORRECTION</div>
									${formattedFields}
									${merchantMessage ? `<div style="font-size:14px;line-height:1.6;color:#475569;font-weight:400;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin-top:12px;padding-top:12px;border-top:1px solid ${orangeColor}30;white-space:pre-line;">${escapeHtml(merchantMessage).replace(/\n/g, '<br/>')}</div>` : ''}
								</div>
							</div>
						</div>
					</td>
				</tr>
			`;
			
			// Combine body text and info box
			bodyContent = `
				<tr>
					<td style="padding:0 24px">
						<div style="font-size:14px;color:#334155;text-align:center;margin-bottom:14px">${greeting},</div>
						<div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${bodyText}</div>
					</td>
				</tr>
				${infoBox}
			`;
		} else {
			// No required info, use normal body rendering
			bodyContent = `
				<tr>
					<td style="padding:0 24px">
						<div style="font-size:14px;color:#334155;text-align:center;margin-bottom:14px">${greeting},</div>
						<div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${bodyText}</div>
					</td>
				</tr>
			`;
		}
	} else if (vars.request_id) {
		// Special handling for notification emails (when request_id is present)
		// Escape HTML helper
		const escapeHtml = (text: string) => {
			return text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		};

		// Create highlighted box for request details
		const boxColor = brand; // Use template's primary color
		const boxBgRgb = brand === '#059669'
			? { r: 5, g: 150, b: 105 }  // Green for new requests
			: brand === '#f59e0b'
			? { r: 245, g: 158, b: 11 }  // Amber for resubmissions
			: { r: 37, g: 99, b: 235 }; // Default blue
		const bgColor = `rgba(${boxBgRgb.r}, ${boxBgRgb.g}, ${boxBgRgb.b}, 0.1)`;

		// Status badge styling (matches requests table)
		const statusBadge = `<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;text-transform:capitalize;">Pending</span>`;

		const detailsBox = `
			<tr>
				<td style="padding:8px 24px 0 24px;">
					<div style="background:${bgColor};border:2px solid ${boxColor};border-radius:16px;padding:24px 24px 28px 24px;margin:8px 0 32px 0;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
						<div style="display:flex;gap:16px;align-items:flex-start;">
							<div style="flex-shrink:0;width:20px;height:20px;background:${boxColor};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px ${boxColor}50;margin:2px 16px 0 0;">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="12" cy="12" r="10" fill="#ffffff"/>
								</svg>
							</div>
							<div style="flex:1;">
								<div style="font-size:12px;font-weight:800;color:${boxColor};text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">REQUEST DETAILS</div>
								<div style="font-size:15px;line-height:1.8;color:#0f172a;font-weight:500;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
									<div style="margin-bottom:10px;"><strong>Name:</strong> ${escapeHtml(String(vars.name || 'N/A'))}</div>
									<div style="margin-bottom:10px;"><strong>Email:</strong> ${escapeHtml(String(vars.email || 'N/A'))}</div>
									<div style="margin-bottom:10px;"><strong>${brand === '#f59e0b' ? 'Resubmitted' : 'Submitted'}:</strong> ${escapeHtml(String(vars.date || 'N/A'))}</div>
									<div style="margin-bottom:10px;"><strong>Status:</strong> ${statusBadge}</div>
									<div><strong>Request ID:</strong> <code style="background:rgba(0,0,0,0.05);padding:2px 8px;border-radius:4px;font-family:monospace;font-size:13px;">${escapeHtml(String(vars.request_id || 'N/A'))}</code></div>
								</div>
							</div>
						</div>
					</div>
				</td>
			</tr>
		`;

		bodyContent = `
			<tr>
				<td style="padding:0 24px">
					<div style="font-size:14px;color:#334155;text-align:center;margin-bottom:8px">${greeting}</div>
					<div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${bodyText}</div>
				</td>
			</tr>
			${detailsBox}
		`;
	} else {
		// Normal body rendering for other templates
		bodyContent = `
			<tr>
				<td style="padding:0 24px">
					<div style="font-size:14px;color:#334155;text-align:center;margin-bottom:14px">${greeting},</div>
					<div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${bodyText}</div>
				</td>
			</tr>
		`;
	}

	return `
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${platformName}</title>
<style>
	:root { --brand: ${brand}; --bg: ${bg}; }
	@media (prefers-color-scheme: dark) {
		body { background-color: #0b1020 !important; }
	}
</style>
</head>
<body style="background-color:${bg};margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
		<tr><td style="padding:28px 0;"></td></tr>
		<tr>
			<td align="center">
				<table role="presentation" width="640" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:0 0 8px 0;box-shadow:0 12px 28px -12px rgba(36,38,51,0.18);">
					<tr><td style="padding:28px 24px 8px 24px">${logo}</td></tr>
					${banner}
					<tr>
						<td style="padding:6px 24px 0 24px">
							<div style="font-size:24px;line-height:1.3;font-weight:800;text-align:center;margin:8px 0 6px 0;">${heading}</div>
						</td>
					</tr>
					${bodyContent}
					${ctasRow}
					${socialsRow}
					<tr>
						<td style="padding:12px 24px 6px 24px">
							<div style="height:1px;background:#e5e7eb"></div>
						</td>
					</tr>
					<tr>
						<td style="font-size:12px;line-height:1.7;color:#64748b;padding:8px 24px 8px 24px;text-align:center">
							${renderTemplate(footerNote, vars)}${footerLinksHtml ? '<br/>' + footerLinksHtml : ''}
						</td>
					</tr>
				</table>
			</td>
		</tr>
		<tr><td style="padding:24px 0;"></td></tr>
	</table>
</body></html>
`.trim();
}

export async function sendEmail(params: {
	to: string | string[];
	subject: string;
	body: string;
	from?: string;
	replyTo?: string;
	config?: EmailConfig | null;
	html?: string | null;
	forceCompanySmtp?: boolean; // When true, always use company SMTP (for store owner emails)
}): Promise<{ ok: boolean; skipped?: boolean; reason?: string; error?: string }> {
	const { to, subject, body, from, replyTo, config, html, forceCompanySmtp } = params;
	
	// If forceCompanySmtp is true, always use company SMTP (for store owner emails)
	let activeTransporter: nodemailer.Transporter | null;
	let usingCustomSmtp: boolean;
	
	if (forceCompanySmtp) {
		// Store owner emails always use company SMTP
		activeTransporter = transporter;
		usingCustomSmtp = false;
	} else {
		// Customer emails use store owner's SMTP if configured
		const tenantTransporter = config && config.useShared === false
			? getCustomTransporter(config?.smtp || null)
			: null;
		activeTransporter = tenantTransporter || transporter;
		usingCustomSmtp = Boolean(
			!config?.useShared &&
			config?.smtp &&
			(config.smtp as any).user &&
			(config.smtp as any).pass
		);
	}
	
	// Soft no-op if not configured
	if (!activeTransporter) {
		// Logging is handled by caller
		return { ok: false, skipped: true, reason: 'SMTP not configured' };
	}
	
	try {
		// From Name handling: Separate logic for store owner emails vs customer emails
		let resolvedFromName: string | undefined;
		if (forceCompanySmtp) {
			// Store owner emails: Use company from name from .env, NOT store owner's config
			resolvedFromName = COMPANY_FROM_NAME ? COMPANY_FROM_NAME.trim() : undefined;
		} else {
			// Customer emails: Use store owner's configured from name
			resolvedFromName = (config?.fromName || '').trim() || undefined;
		}
		
		// If using shared SMTP (company SMTP), force DEFAULT_FROM (ignore config.fromEmail to avoid unauthorized domain issues)
		// If using custom SMTP, allow config.fromEmail
		const resolvedFromEmail = usingCustomSmtp
			? (config?.fromEmail || from || DEFAULT_FROM).trim()
			: (from || DEFAULT_FROM).trim();
		const fromEmail = resolvedFromEmail || DEFAULT_FROM;
		const prettyFrom = resolvedFromName ? `"${resolvedFromName}" <${fromEmail}>` : fromEmail;
		
		// Reply-to handling: Separate logic for store owner emails vs customer emails
		let resolvedReplyTo: string | undefined;
		if (forceCompanySmtp) {
			// Store owner emails: Use company reply-to from .env (or passed parameter), NOT store owner's config
			resolvedReplyTo = replyTo || COMPANY_REPLY_TO || undefined;
		} else {
			// Customer emails: Use store owner's configured reply-to (or passed parameter)
			resolvedReplyTo = replyTo || config?.replyTo || undefined;
		}
		
		await activeTransporter.sendMail({
			from: prettyFrom,
			to: Array.isArray(to) ? to.join(',') : to,
			subject,
			text: body,
			html: html || undefined,
			replyTo: resolvedReplyTo,
		});
		return { ok: true };
	} catch (e) {
		// Error logging is handled by caller
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}

export async function trySendTemplatedEmail(args: {
	to?: string | null;
	template: EmailTemplate;
	vars: Record<string, any>;
	from?: string;
	replyTo?: string;
	config?: EmailConfig | null;
	templateKey?: TemplateKey;
	isCustomerEmail?: boolean; // When true, validates SMTP before sending
}): Promise<{ ok: boolean; skipped?: boolean; reason?: string; error?: string }> {
	const { to, template, vars, from, replyTo, config, templateKey, isCustomerEmail } = args;
	if (!to) return { ok: false, skipped: true, reason: 'No recipient email address provided' };
	
	// For customer emails, validate SMTP is configured and customer emails are enabled
	if (isCustomerEmail) {
		if (!isSmtpConfigured(config)) {
			return { ok: false, skipped: true, reason: 'Store owner SMTP not configured. Customer emails require SMTP configuration.' };
		}
		// Check if customer emails are explicitly disabled
		if (config?.customerEmailsEnabled === false) {
			return { ok: false, skipped: true, reason: 'Customer emails are disabled in Email Settings.' };
		}
	}
	
	const subject = renderTemplate(template.subject, vars);
	const body = renderTemplate(template.body, vars);
	
	// Generate HTML with actual user variables (not preview vars)
	// If template has design, generate HTML on-the-fly with actual vars
	// Otherwise, use pre-generated HTML if available
	let html: string | null = null;
	if (template?.useHtml) {
		if (template.design && templateKey) {
			// Generate HTML from design with actual user variables
			html = generateEmailHtml(template, vars, templateKey);
		} else if (template.html) {
			// Use pre-generated HTML and replace variables
			html = renderTemplate(String(template.html), vars);
		}
	}
	
	const result = await sendEmail({ to, subject, body, html, from, replyTo, config, forceCompanySmtp: false });
	// Ensure consistent return type - always include reason when skipped
	if (result.ok) {
		return { ok: true };
	} else if (result.skipped) {
		return { ok: false, skipped: true, reason: result.reason || 'Email sending was skipped' };
	} else {
		return { ok: false, error: result.error || 'Unknown error occurred' };
	}
}

// Helper function to send owner notification emails
export async function sendOwnerNotification(args: {
	ownerEmail: string;
	templateKey: NotificationTemplateKey;
	vars: Record<string, any>;
	config?: EmailConfig | null;
}) {
	const { ownerEmail, templateKey, vars, config } = args;
	if (!ownerEmail) return { ok: false, skipped: true };

	const template = NOTIFICATION_TEMPLATES[templateKey];
	if (!template) return { ok: false, skipped: true };

	const subject = renderTemplate(template.subject, vars);
	const body = renderTemplate(template.body, vars);

	// Generate HTML using the existing generateEmailHtml function
	// We need to cast templateKey to work with generateEmailHtml
	let html: string | null = null;
	if (template.design) {
		// Use a placeholder for the template key since generateEmailHtml expects TemplateKey
		// but we're using NotificationTemplateKey. The function doesn't actually validate the key,
		// it just uses it for default titles which we're overriding anyway.
		html = generateEmailHtml(template, vars, 'signup' as TemplateKey);
	}

	// Store owner emails always use company SMTP
	return await sendEmail({
		to: ownerEmail,
		subject,
		body,
		html,
		config,
		forceCompanySmtp: true // Always use company SMTP for store owner emails
	});
}


