'use client'

import React, { useEffect, useState } from 'react';
import { useSession } from '@/context/session';

type SmtpConfig = {
	host: string;
	port: number | string;
	user: string;
	pass: string;
	secure?: boolean;
};

type EmailConfig = {
	fromEmail?: string | null;
	fromName?: string | null;
	replyTo?: string | null;
	useShared?: boolean | null;
	smtp?: SmtpConfig | null;
};

const EmailConfigForm: React.FC = () => {
	const { context } = useSession();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [useShared, setUseShared] = useState(true);
	const [fromEmail, setFromEmail] = useState('');
	const [fromName, setFromName] = useState('');
	const [replyTo, setReplyTo] = useState('');
	const [smtp, setSmtp] = useState<SmtpConfig>({
		host: 'smtp-relay.brevo.com',
		port: 587,
		user: '',
		pass: '',
		secure: false,
	});
	const [original, setOriginal] = useState<EmailConfig | null>(null);

	const normalized = (cfg: EmailConfig): EmailConfig => ({
		useShared: Boolean(cfg?.useShared ?? true),
		fromEmail: cfg?.fromEmail || null,
		fromName: cfg?.fromName || null,
		replyTo: cfg?.replyTo || null,
		smtp: cfg?.smtp
			? {
					host: String(cfg.smtp.host || ''),
					port: Number(cfg.smtp.port || 0),
					user: String(cfg.smtp.user || ''),
					pass: String(cfg.smtp.pass || ''),
					secure: Boolean(cfg.smtp.secure),
			  }
			: { host: '', port: 0, user: '', pass: '', secure: false },
	});

	const currentConfig: EmailConfig = normalized({
		useShared,
		fromEmail,
		fromName,
		replyTo,
		smtp,
	});

	const isDirty = JSON.stringify(currentConfig) !== JSON.stringify(original || normalized({ useShared: true, smtp: { host: '', port: 0, user: '', pass: '', secure: false } }));

	useEffect(() => {
		const load = async () => {
			if (!context) return;
			setNotice(null);
			setLoading(true);
			try {
				const res = await fetch(`/api/email-config?context=${encodeURIComponent(context)}`);
				if (res.ok) {
					const json = await res.json();
					const cfg: EmailConfig = json?.config || {};
					setFromEmail(String(cfg?.fromEmail || ''));
					setFromName(String(cfg?.fromName || ''));
					setReplyTo(String(cfg?.replyTo || ''));
					setUseShared(Boolean(cfg?.useShared ?? true));
					const hasCustom = !!(cfg?.smtp && (cfg.smtp as any));
					if (hasCustom) {
						const s = (cfg.smtp as SmtpConfig) || ({} as SmtpConfig);
						setSmtp({
							host: s.host || 'smtp-relay.brevo.com',
							port: s.port ?? 587,
							user: s.user || '',
							pass: s.pass || '',
							secure: !!s.secure,
						});
					}
					setOriginal(normalized({
						useShared: Boolean(cfg?.useShared ?? true),
						fromEmail: String(cfg?.fromEmail || '') || null,
						fromName: String(cfg?.fromName || '') || null,
						replyTo: String(cfg?.replyTo || '') || null,
						smtp: hasCustom
							? (() => {
									const s = (cfg.smtp as SmtpConfig) || ({} as SmtpConfig);
									return {
										host: s.host || 'smtp-relay.brevo.com',
										port: s.port ?? 587,
										user: s.user || '',
										pass: s.pass || '',
										secure: !!s.secure,
									};
							  })()
							: { host: '', port: 0, user: '', pass: '', secure: false },
					}));
				}
			} catch {}
			setLoading(false);
		};
		load();
	}, [context]);

	const save = async () => {
		if (!context) return;
		setNotice(null);
		setSaving(true);
		try {
			// Require fromEmail when using custom SMTP
			if (!useShared && !String(fromEmail || '').trim()) {
				alert('Please provide a From Email when using your own SMTP.');
				return;
			}
			const payload: EmailConfig = {
				fromEmail: fromEmail || null,
				fromName: fromName || null,
				replyTo: replyTo || null,
				useShared,
				smtp: useShared
					? {
							// keep saved creds even when using shared (for convenience)
							host: String(smtp.host || 'smtp-relay.brevo.com'),
							port: Number(smtp.port || 587),
							user: String(smtp.user || ''),
							pass: String(smtp.pass || ''),
							secure: !!smtp.secure,
					  }
					: {
							host: String(smtp.host || 'smtp-relay.brevo.com'),
							port: Number(smtp.port || 587),
							user: String(smtp.user || ''),
							pass: String(smtp.pass || ''),
							secure: !!smtp.secure,
					  },
			};
			const res = await fetch(`/api/email-config?context=${encodeURIComponent(context)}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ config: payload }),
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || 'Failed to save settings');
			}
			// Update original so button disables
			setOriginal(normalized(payload));
			setNotice({ type: 'success', text: 'Settings saved successfully.' });
		} finally {
			setSaving(false);
			setTimeout(() => setNotice(null), 2500);
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-5 w-40 bg-gray-200 rounded" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
						<div className="h-10 bg-gray-200 rounded" />
					</div>
					<div className="h-10 w-32 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-700">Email Settings</h3>
				<span className="text-xs text-gray-500">{loading ? 'Loading…' : ''}</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-600 mb-1">From Email</label>
					<input
						type="email"
						value={fromEmail}
						onChange={(e) => setFromEmail(e.target.value)}
						placeholder="no-reply@yourdomain.com"
						disabled={useShared}
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${useShared ? 'border-gray-100 bg-gray-50 text-gray-500' : 'border-gray-200'}`}
					/>
					<p className="text-xs text-gray-500 mt-1">
						{useShared
							? 'Using shared sender. Uncheck to use your own SMTP and sender address.'
							: 'Required: must be an address on your authenticated domain.'}
					</p>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-600 mb-1">From Name</label>
					<input
						type="text"
						value={fromName}
						onChange={(e) => setFromName(e.target.value)}
						placeholder="e.g. Signup Customisation App"
						className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-600 mb-1">Reply-To</label>
					<input
						type="email"
						value={replyTo}
						onChange={(e) => setReplyTo(e.target.value)}
						placeholder="support@yourstore.com"
						disabled={useShared}
						className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${useShared ? 'border-gray-100 bg-gray-50 text-gray-500' : 'border-gray-200'}`}
					/>
					<p className="text-xs text-gray-500 mt-1">
						{useShared
							? 'Using shared sender. Reply-To is managed globally.'
							: 'Optional: where customers’ replies should go.'}
					</p>
				</div>
			</div>

			<div className="mt-2">
				<label className="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={useShared}
						onChange={(e) => setUseShared(e.target.checked)}
						className="rounded border-gray-300"
					/>
					Use shared sender (recommended)
				</label>
				<p className="text-xs text-gray-500 mt-1">
					When enabled, emails send from the app’s shared domain. Uncheck to use your own SMTP
					credentials (Brevo).
				</p>
			</div>

			<div className={`${useShared ? 'opacity-50 pointer-events-none' : ''}`}>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-600 mb-1">SMTP Host</label>
						<input
							type="text"
							value={smtp.host}
							onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-600 mb-1">SMTP Port</label>
						<input
							type="number"
							value={smtp.port}
							onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value || 0) })}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-600 mb-1">SMTP User</label>
						<input
							type="text"
							value={smtp.user}
							onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-600 mb-1">SMTP Password</label>
						<input
							type="password"
							value={smtp.pass}
							onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
							className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent"
						/>
					</div>
				</div>
				<label className="inline-flex items-center gap-2 text-sm mt-2">
					<input
						type="checkbox"
						checked={!!smtp.secure}
						onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
						className="rounded border-gray-300"
					/>
					Use SSL/TLS (port 465)
				</label>
			</div>

			<div className="flex gap-3">
				<button
					onClick={save}
					disabled={saving || loading || !isDirty}
					className={`px-6 py-3 rounded-lg font-medium ${
						saving || loading || !isDirty
							? 'bg-gray-200 text-gray-500 cursor-not-allowed'
							: 'bg-gray-900 text-white hover:bg-black'
					}`}
				>
					{saving ? 'Saving…' : (isDirty ? 'Save Settings' : 'Save Settings')}
				</button>
				{notice ? (
					<div
						className={`px-3 py-2 rounded-lg text-sm ${
							notice.type === 'success'
								? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
								: 'bg-rose-50 text-rose-700 border border-rose-200'
						}`}
					>
						{notice.text}
					</div>
				) : null}
			</div>
		</div>
	);
};

export default EmailConfigForm;


