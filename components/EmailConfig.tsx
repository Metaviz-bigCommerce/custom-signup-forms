'use client'

import React, { useEffect, useState } from 'react';
import { Mail, Settings, Server, User, AtSign, Lock, Save, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';

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
	const toast = useToast();
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
				toast.showWarning('Please provide a From Email when using your own SMTP.');
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
			<div className="space-y-4 sm:space-y-6">
				{/* Header Skeleton */}
				<div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8">
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl" />
						<div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
					</div>
					<div className="relative z-10">
						<div className="h-6 sm:h-8 w-48 sm:w-64 bg-white/10 rounded animate-pulse mb-2" />
						<div className="h-3 sm:h-4 w-full sm:w-96 bg-white/5 rounded animate-pulse" />
					</div>
				</div>
				{/* Content Skeleton */}
				<div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-4 sm:p-6">
					<div className="animate-pulse space-y-4 sm:space-y-6">
						<div className="h-5 sm:h-6 w-40 sm:w-48 bg-slate-200 rounded" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="h-12 bg-slate-100 rounded-xl" />
							<div className="h-12 bg-slate-100 rounded-xl" />
							<div className="h-12 bg-slate-100 rounded-xl" />
							<div className="h-12 bg-slate-100 rounded-xl" />
						</div>
						<div className="h-10 sm:h-12 w-32 sm:w-40 bg-slate-200 rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Header Section */}
			<div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8">
				{/* Background decorative elements */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl" />
					<div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
				</div>
				
				<div className="relative z-10">
					<div className="flex items-center gap-2 sm:gap-3 mb-2">
						<div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
							<Mail className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-[26px] sm:text-2xl font-bold !text-white">Email Settings</h1>
							<p className="text-slate-400 text-xs sm:text-sm">Configure your email sending preferences and SMTP credentials</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<div className="relative">
				{/* Decorative background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
					<div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
					<div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
				</div>

				<div className="relative bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
					<div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
						{/* Shared Sender Toggle Section */}
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 sm:p-6">
							<div className="flex flex-col sm:flex-row items-start justify-between gap-4">
								<div className="flex-1 w-full">
									<div className="flex items-center gap-2 sm:gap-3 mb-2">
										<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
											<Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
										</div>
										<h3 className="text-base sm:text-lg font-semibold text-slate-800">Sender Configuration</h3>
									</div>
									<p className="text-xs sm:text-sm text-slate-600 mb-4">
										Choose between using the shared sender (recommended) or configure your own SMTP server.
									</p>
									
									{/* Modern Toggle Switch */}
									<label className="inline-flex items-start gap-2 sm:gap-3 cursor-pointer group w-full">
										<div className="relative flex items-center pt-0.5 flex-shrink-0">
											<input
												type="checkbox"
												checked={useShared}
												onChange={(e) => setUseShared(e.target.checked)}
												className="sr-only"
											/>
											<div className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all duration-300 flex items-center ${
												useShared 
													? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
													: 'bg-slate-300'
											}`}>
												<div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
													useShared ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
												}`} />
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<span className={`text-sm sm:text-base font-semibold transition-colors block ${
												useShared ? 'text-blue-700' : 'text-slate-700'
											}`}>
												{useShared ? 'Using Shared Sender' : 'Using Custom SMTP'}
											</span>
											<p className="text-xs text-slate-500 mt-0.5">
												{useShared 
													? "Emails send from the app's shared domain (recommended)"
													: "Configure your own SMTP credentials (Brevo)"}
											</p>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Sender Information Section */}
						<div className="space-y-4 sm:space-y-6">
							<div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-slate-200">
								<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
									<User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-slate-800">Sender Information</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<AtSign className="w-4 h-4 text-slate-500" />
										From Email
									</label>
									<input
										type="email"
										value={fromEmail}
										onChange={(e) => setFromEmail(e.target.value)}
										placeholder="no-reply@yourdomain.com"
										disabled={useShared}
										className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											useShared 
												? 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed' 
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-xs text-slate-500 mt-1.5">
										{useShared
											? 'Using shared sender. Toggle off to use your own SMTP and sender address.'
											: 'Required: must be an address on your authenticated domain.'}
									</p>
								</div>
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<User className="w-4 h-4 text-slate-500" />
										From Name
									</label>
									<input
										type="text"
										value={fromName}
										onChange={(e) => setFromName(e.target.value)}
										placeholder="e.g. Signup Customisation App"
										className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 transition-all"
									/>
									<p className="text-xs text-slate-500 mt-1.5">
										Display name shown in recipient's inbox
									</p>
								</div>
								<div className="space-y-2 md:col-span-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<Mail className="w-4 h-4 text-slate-500" />
										Reply-To
									</label>
									<input
										type="email"
										value={replyTo}
										onChange={(e) => setReplyTo(e.target.value)}
										placeholder="support@yourstore.com"
										disabled={useShared}
										className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											useShared 
												? 'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed' 
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-xs text-slate-500 mt-1.5">
										{useShared
											? "Using shared sender. Reply-To is managed globally."
											: "Optional: where customers' replies should go."}
									</p>
								</div>
							</div>
						</div>

						{/* SMTP Configuration Section */}
						<div className={`space-y-4 sm:space-y-6 transition-all duration-300 ${useShared ? 'opacity-40 pointer-events-none' : ''}`}>
							<div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-slate-200 flex-wrap">
								<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
									<Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
								</div>
								<h3 className="text-base sm:text-lg font-semibold text-slate-800">SMTP Configuration</h3>
								{useShared && (
									<span className="ml-auto px-2 sm:px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full whitespace-nowrap">
										Disabled (using shared sender)
									</span>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<Server className="w-4 h-4 text-slate-500" />
										SMTP Host
									</label>
									<input
										type="text"
										value={smtp.host}
										onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
										placeholder="smtp-relay.brevo.com"
										className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 transition-all"
									/>
								</div>
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<Settings className="w-4 h-4 text-slate-500" />
										SMTP Port
									</label>
									<input
										type="number"
										value={smtp.port}
										onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value || 0) })}
										placeholder="587"
										className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 transition-all"
									/>
								</div>
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<User className="w-4 h-4 text-slate-500" />
										SMTP Username
									</label>
									<input
										type="text"
										value={smtp.user}
										onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
										placeholder="Your SMTP username"
										className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 transition-all"
									/>
								</div>
								<div className="space-y-2">
									<label className="flex items-center gap-2 text-sm font-medium text-slate-700">
										<Lock className="w-4 h-4 text-slate-500" />
										SMTP Password
									</label>
									<input
										type="password"
										value={smtp.pass}
										onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
										placeholder="Your SMTP password"
										className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 transition-all"
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
								<input
									type="checkbox"
									checked={!!smtp.secure}
									onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
									className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
								/>
								<div>
									<label className="text-sm font-medium text-slate-700 cursor-pointer">
										Use SSL/TLS (port 465)
									</label>
									<p className="text-xs text-slate-500 mt-0.5">
										Enable for secure connections on port 465
									</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-4 border-t border-slate-200">
							<button
								onClick={save}
								disabled={saving || loading || !isDirty}
								className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
									saving || loading || !isDirty
										? 'bg-slate-200 text-slate-500 cursor-not-allowed'
										: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
								}`}
							>
								{saving ? (
									<>
										<RefreshCw className="w-4 h-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="w-4 h-4" />
										Save Settings
									</>
								)}
							</button>
							
							{notice && (
								<div
									className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium border transition-all duration-300 ${
										notice.type === 'success'
											? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10'
											: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10'
									}`}
								>
									{notice.type === 'success' ? (
										<CheckCircle2 className="w-4 h-4 flex-shrink-0" />
									) : (
										<AlertCircle className="w-4 h-4 flex-shrink-0" />
									)}
									<span className="break-words">{notice.text}</span>
								</div>
							)}
							
							{!isDirty && !notice && (
								<div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
									<CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
									<span>All changes saved</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmailConfigForm;


