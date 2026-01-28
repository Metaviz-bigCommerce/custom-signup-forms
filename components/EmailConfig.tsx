'use client'

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Settings, Server, User, AtSign, Lock, Save, RefreshCw, CheckCircle2, AlertCircle, Sparkles, HelpCircle, X } from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

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
	useShared?: boolean | null; // Deprecated - kept for backward compatibility
	smtp?: SmtpConfig | null;
	customerEmailsEnabled?: boolean | null; // New field to track if customer emails are enabled
};

const EmailConfigForm: React.FC = () => {
	const { context } = useSession();
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
	const toast = useToast();
	const [customerEmailsEnabled, setCustomerEmailsEnabled] = useState(false);
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
  const [editSnapshot, setEditSnapshot] = useState<{
    customerEmailsEnabled: boolean;
    fromEmail: string;
    fromName: string;
    replyTo: string;
    smtp: SmtpConfig;
  } | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [saveAttempted, setSaveAttempted] = useState(false);
	
	// Helper function to check if SMTP is fully configured
	const isSmtpConfigured = (): boolean => {
		return !!(smtp.host?.trim() && smtp.port && smtp.user?.trim() && smtp.pass?.trim());
	};
	
	// Helper function to check if all required fields are filled
	// const areRequiredFieldsFilled = (): boolean => {
	// 	return !!(
	// 		fromEmail?.trim() &&
	// 		fromName?.trim() &&
	// 		replyTo?.trim() &&
	// 		smtp.host?.trim() &&
	// 		smtp.port &&
	// 		smtp.user?.trim() &&
	// 		smtp.pass?.trim()
	// 	);
	// };

	const normalized = (cfg: EmailConfig): EmailConfig => {
		// Migrate old useShared to customerEmailsEnabled
		let customerEmailsEnabled = cfg?.customerEmailsEnabled ?? false;
		if (cfg?.useShared !== undefined && cfg?.customerEmailsEnabled === undefined) {
			// Migration: if useShared was false and SMTP is configured, enable customer emails
			const hasSmtp = !!(cfg?.smtp && cfg.smtp.host && cfg.smtp.port && cfg.smtp.user && cfg.smtp.pass);
			customerEmailsEnabled = !cfg.useShared && hasSmtp;
		}
		
		return {
			useShared: false, // Always false now (deprecated)
		fromEmail: cfg?.fromEmail || null,
		fromName: cfg?.fromName || null,
		replyTo: cfg?.replyTo || null,
			customerEmailsEnabled,
		smtp: cfg?.smtp
			? {
					host: String(cfg.smtp.host || ''),
					port: Number(cfg.smtp.port || 0),
					user: String(cfg.smtp.user || ''),
					pass: String(cfg.smtp.pass || ''),
					secure: Boolean(cfg.smtp.secure),
			  }
			: { host: '', port: 0, user: '', pass: '', secure: false },
		};
	};

	const currentConfig: EmailConfig = normalized({
		useShared: false,
		customerEmailsEnabled,
		fromEmail,
		fromName,
		replyTo,
		smtp,
	});

	const isDirty = JSON.stringify(currentConfig) !== JSON.stringify(original || normalized({ useShared: false, customerEmailsEnabled: false, smtp: { host: '', port: 0, user: '', pass: '', secure: false } }));
	
	// Only show unsaved changes warning when in edit mode
	const hasUnsavedChanges = isEditing && isDirty;

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
					
					// Migrate useShared to customerEmailsEnabled
					let customerEmailsEnabled = cfg?.customerEmailsEnabled ?? false;
					if (cfg?.useShared !== undefined && cfg?.customerEmailsEnabled === undefined) {
						const hasSmtp = !!(cfg?.smtp && cfg.smtp.host && cfg.smtp.port && cfg.smtp.user && cfg.smtp.pass);
						customerEmailsEnabled = !cfg.useShared && hasSmtp;
					}
					setCustomerEmailsEnabled(customerEmailsEnabled);
					
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
					setOriginal(normalized(cfg));
				}
			} catch {}
			setLoading(false);
		};
		load();
	}, [context]);
	
	// Handle unsaved changes warning
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};
		
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);
	
	// Intercept navigation when there are unsaved changes
	// const handleNavigation = useCallback((url: string) => {
	// 	if (hasUnsavedChanges) {
	// 		setPendingNavigation(url);
	// 		setShowUnsavedDialog(true);
	// 	} else {
	// 		router.push(url);
	// 	}
	// }, [hasUnsavedChanges, router]);
	
  // Enter edit mode
  const handleEdit = () => {
    setIsEditing(true);
    setEditSnapshot({
      customerEmailsEnabled,
      fromEmail,
      fromName,
      replyTo,
      smtp: { ...smtp },
    });
    setNotice(null);
    setTouchedFields(new Set());
    setSaveAttempted(false);
  };
	
  // Cancel editing and revert to snapshot
  const handleCancel = () => {
    if (editSnapshot) {
      setCustomerEmailsEnabled(editSnapshot.customerEmailsEnabled);
      setFromEmail(editSnapshot.fromEmail);
      setFromName(editSnapshot.fromName);
      setReplyTo(editSnapshot.replyTo);
      setSmtp(editSnapshot.smtp);
    }
    setIsEditing(false);
    setEditSnapshot(null);
    setNotice(null);
    setTouchedFields(new Set());
    setSaveAttempted(false);
  };
	
	const handleConfirmNavigation = () => {
		setShowUnsavedDialog(false);
		if (pendingNavigation) {
			router.push(pendingNavigation);
			setPendingNavigation(null);
		}
	};
	
	const handleCancelNavigation = () => {
		setShowUnsavedDialog(false);
		setPendingNavigation(null);
	};

  const save = async () => {
    if (!context) return;
    setNotice(null);
    setSaving(true);
    setSaveAttempted(true);
    try {
      // Validate all required fields
      const missingFields: string[] = [];
      if (!String(fromEmail || '').trim()) missingFields.push('From Email');
      if (!String(fromName || '').trim()) missingFields.push('From Name');
      if (!String(replyTo || '').trim()) missingFields.push('Reply-To');
      if (!String(smtp.host || '').trim()) missingFields.push('SMTP Host');
      if (!smtp.port) missingFields.push('SMTP Port');
      if (!String(smtp.user || '').trim()) missingFields.push('SMTP Username');
      if (!String(smtp.pass || '').trim()) missingFields.push('SMTP Password');
      
      if (missingFields.length > 0) {
        toast.showWarning(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }
			
			// If customer emails are enabled, SMTP must be fully configured
			if (customerEmailsEnabled && !isSmtpConfigured()) {
				toast.showWarning('SMTP must be fully configured to enable customer emails.');
				setSaving(false);
				return;
			}
			
			const payload: EmailConfig = {
				fromEmail: fromEmail || null,
				fromName: fromName || null,
				replyTo: replyTo || null,
				useShared: false, // Always false (deprecated)
				customerEmailsEnabled: customerEmailsEnabled && isSmtpConfigured(),
				smtp: {
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
      setIsEditing(false);
      setEditSnapshot(null);
      setTouchedFields(new Set());
      setSaveAttempted(false);
		} finally {
			setSaving(false);
			setTimeout(() => setNotice(null), 2500);
		}
	};

	if (loading) {
		return (
			<div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
				{/* Header Skeleton */}
				<div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8">
					<div className="absolute inset-0 overflow-hidden">
						<div className="absolute -top-20 -right-20 w-40 h-40 sm:w-60 sm:h-60 bg-purple-500/15 rounded-full blur-3xl" />
						<div className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-60 sm:h-60 bg-blue-500/15 rounded-full blur-3xl" />
					</div>
					<div className="relative z-10">
						<div className="h-5 sm:h-6 md:h-8 w-36 sm:w-48 md:w-64 bg-white/10 rounded animate-pulse mb-1.5 sm:mb-2" />
						<div className="h-2.5 sm:h-3 md:h-4 w-full sm:w-3/4 md:w-96 bg-white/5 rounded animate-pulse" />
					</div>
				</div>
				{/* Content Skeleton */}
				<div className="bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-3 sm:p-4 md:p-6 w-full">
					<div className="animate-pulse space-y-3 sm:space-y-4 md:space-y-6">
						<div className="h-4 sm:h-5 md:h-6 w-32 sm:w-40 md:w-48 bg-slate-200 rounded" />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
							<div className="h-10 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl" />
							<div className="h-10 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl" />
							<div className="h-10 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl" />
							<div className="h-10 sm:h-12 bg-slate-100 rounded-lg sm:rounded-xl" />
						</div>
						<div className="h-9 sm:h-10 md:h-12 w-28 sm:w-32 md:w-40 bg-slate-200 rounded-lg sm:rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
			{/* Header Section */}
			<div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8">
				{/* Background decorative elements */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-20 -right-20 w-40 h-40 sm:w-60 sm:h-60 bg-purple-500/15 rounded-full blur-3xl" />
					<div className="absolute -bottom-20 -left-20 w-40 h-40 sm:w-60 sm:h-60 bg-blue-500/15 rounded-full blur-3xl" />
				</div>
				
				<div className="relative z-10">
					<div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
						<div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
							<Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
						</div>
						<div className="min-w-0 flex-1 overflow-hidden">
							<h1 className="sm:text-2xl md:text-3xl lg:text-4xl font-bold !text-white break-words">Email Settings</h1>
							<p className="text-slate-400 text-[11px] sm:text-xs md:text-sm mt-0.5 break-words">
								Configure SMTP settings to send customer emails from your own email address. All fields marked with <span className="text-red-400">*</span> are required.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Card */}
			<div className="relative w-full max-w-full">
				{/* Decorative background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
					<div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
					<div className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
				</div>

				<div className={`relative bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/50 border overflow-hidden w-full transition-all duration-300 ${
					isEditing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
				}`}>
					<div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
						{/* Edit Mode Header */}
						{!isEditing && (
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200">
								<div className="flex-1">
									<h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-1">Email Configuration</h2>
									<p className="text-xs sm:text-sm text-slate-600">Review your current SMTP settings. Click &quot;Edit Settings&quot; to make changes.</p>
								</div>
								<button
									onClick={handleEdit}
									disabled={loading}
									className="flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="whitespace-nowrap">Edit Settings</span>
								</button>
							</div>
						)}
						
						{isEditing && (
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-blue-200 bg-blue-50/50 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6 lg:pt-8 rounded-t-xl sm:rounded-t-2xl">
								<div className="flex-1">
									<h2 className="text-base sm:text-lg font-semibold text-blue-800 mb-1 flex items-center gap-2">
										<Settings className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
										Editing Mode
									</h2>
									<p className="text-xs sm:text-sm text-blue-700">You are now editing your SMTP settings. Remember to save your changes.</p>
								</div>
							</div>
						)}
						
						{/* Purpose & Information Section */}
						<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6">
							<div className="flex items-start gap-3 sm:gap-4">
								<div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
									<Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 break-words mb-2 sm:mb-3">About This Page</h3>
									<div className="space-y-2 text-[11px] sm:text-xs md:text-sm text-slate-600 break-words">
										<p>
											<strong className="text-slate-700">Purpose:</strong> Configure your SMTP settings to send emails to customers. SMTP setup is mandatory — if not configured, no customer emails will be sent.
										</p>
										<p>
											<strong className="text-slate-700">Store owner emails</strong> always use the company SMTP (configured in system settings).<br/>
											<strong className="text-slate-700">Customer emails</strong> require your own SMTP configuration below.
										</p>
										<p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
											<strong>⚠️ Important:</strong> All fields marked with <span className="text-red-600 font-bold">*</span> are required. You must click &quot;Save Settings&quot; to apply changes.
										</p>
									</div>
								</div>
							</div>
						</div>
						
						{/* Enable Customer Emails Toggle Section */}
						<div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6">
							<div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
								<div className="flex-1 w-full min-w-0">
									<div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2 flex-wrap">
										<div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ${
											customerEmailsEnabled && isSmtpConfigured()
												? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/25'
												: 'bg-slate-400 shadow-slate-500/25'
										}`}>
											<Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
										</div>
										<h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 break-words">Enable Customer Emails</h3>
									</div>
									<p className="text-[11px] sm:text-xs md:text-sm text-slate-600 mb-3 sm:mb-4 break-words">
										Enable this to send emails to customers. SMTP must be fully configured and validated below.
									</p>
									
									{/* Modern Toggle Switch */}
									<label className={`inline-flex items-start gap-2 sm:gap-2.5 md:gap-3 w-full min-w-0 ${
										isEditing && isSmtpConfigured() ? 'cursor-pointer group' : 'cursor-not-allowed opacity-60'
									}`}>
										<div className="relative flex items-center pt-0.5 flex-shrink-0 touch-manipulation">
											<input
												type="checkbox"
												checked={customerEmailsEnabled && isSmtpConfigured()}
												onChange={(e) => {
													if (isEditing && isSmtpConfigured()) {
														setCustomerEmailsEnabled(e.target.checked);
													}
												}}
												disabled={!isEditing || !isSmtpConfigured()}
												className="sr-only"
											/>
											<div className={`w-11 h-6 sm:w-12 sm:h-7 md:w-14 md:h-8 rounded-full transition-all duration-300 flex items-center ${
												customerEmailsEnabled && isSmtpConfigured()
													? 'bg-gradient-to-r from-emerald-600 to-teal-600' 
													: 'bg-slate-300'
											}`}>
												<div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
													customerEmailsEnabled && isSmtpConfigured() ? 'translate-x-5 sm:translate-x-6 md:translate-x-7' : 'translate-x-0.5 sm:translate-x-1'
												}`} />
											</div>
										</div>
										<div className="flex-1 min-w-0 overflow-hidden">
											<span className={`text-xs sm:text-sm md:text-base font-semibold transition-colors block break-words ${
												customerEmailsEnabled && isSmtpConfigured() ? 'text-emerald-700' : 'text-slate-700'
											}`}>
												{customerEmailsEnabled && isSmtpConfigured() ? 'Customer Emails Enabled' : 'Customer Emails Disabled'}
											</span>
											<p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 break-words">
												{isSmtpConfigured()
													? customerEmailsEnabled
														? 'Customer emails will be sent using your SMTP configuration'
														: 'Enable to send emails to customers using your SMTP'
													: 'Configure SMTP settings below to enable customer emails'}
											</p>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Sender Information Section */}
						<div className="space-y-3 sm:space-y-4 md:space-y-6">
							<div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-slate-200 flex-wrap">
								<div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
									<User className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
								</div>
								<h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 break-words">Sender Information</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<AtSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">From Email</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													The email address that appears as the sender. Must be on your authenticated domain.
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="email"
										value={fromEmail}
										onChange={(e) => {
											setFromEmail(e.target.value);
											setTouchedFields(prev => new Set(prev).add('fromEmail'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('fromEmail'))}
										placeholder="no-reply@yourdomain.com"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('fromEmail') || saveAttempted) && !fromEmail?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: The email address that will appear as the sender. Must be on your authenticated domain.
									</p>
								</div>
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">From Name</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													The display name shown in the recipient&apos;s inbox (e.g., &quot;John&apos;s Store&quot;)
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="text"
										value={fromName}
										onChange={(e) => {
											setFromName(e.target.value);
											setTouchedFields(prev => new Set(prev).add('fromName'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('fromName'))}
										placeholder="e.g. John's Store"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('fromName') || saveAttempted) && !fromName?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Display name shown in recipient&apos;s inbox
									</p>
								</div>
								<div className="space-y-1.5 sm:space-y-2 md:col-span-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">Reply-To</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													Where customers&apos; email replies should be sent
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="email"
										value={replyTo}
										onChange={(e) => {
											setReplyTo(e.target.value);
											setTouchedFields(prev => new Set(prev).add('replyTo'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('replyTo'))}
										placeholder="support@yourstore.com"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('replyTo') || saveAttempted) && !replyTo?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Where customers&apos; replies should be sent
									</p>
								</div>
							</div>
						</div>

						{/* SMTP Configuration Section */}
						<div className="space-y-3 sm:space-y-4 md:space-y-6">
							<div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-slate-200 flex-wrap">
								<div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ${
									isSmtpConfigured()
										? 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/25'
										: 'bg-gradient-to-br from-amber-600 to-orange-600 shadow-amber-500/25'
								}`}>
									<Server className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
								</div>
								<h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-800 break-words flex-1 min-w-0">SMTP Configuration</h3>
								{isSmtpConfigured() ? (
									<span className="px-2 sm:px-2.5 md:px-3 py-1 text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full break-words">
										Configured
									</span>
								) : (
									<span className="px-2 sm:px-2.5 md:px-3 py-1 text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-700 rounded-full break-words">
										Required for Customer Emails
									</span>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">SMTP Host</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													Your SMTP server hostname (e.g., smtp-relay.brevo.com)
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="text"
										value={smtp.host}
										onChange={(e) => {
											setSmtp({ ...smtp, host: e.target.value });
											setTouchedFields(prev => new Set(prev).add('smtpHost'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('smtpHost'))}
										placeholder="smtp-relay.brevo.com"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('smtpHost') || saveAttempted) && !smtp.host?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Your SMTP server hostname
									</p>
								</div>
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">SMTP Port</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													SMTP port number (587 for TLS, 465 for SSL)
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="number"
										value={smtp.port}
										onChange={(e) => {
											setSmtp({ ...smtp, port: Number(e.target.value || 0) });
											setTouchedFields(prev => new Set(prev).add('smtpPort'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('smtpPort'))}
										placeholder="587"
										min="1"
										max="65535"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('smtpPort') || saveAttempted) && !smtp.port
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Port number (587 for TLS, 465 for SSL)
									</p>
								</div>
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">SMTP Username</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													Your SMTP authentication username
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="text"
										value={smtp.user}
										onChange={(e) => {
											setSmtp({ ...smtp, user: e.target.value });
											setTouchedFields(prev => new Set(prev).add('smtpUser'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('smtpUser'))}
										placeholder="Your SMTP username"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('smtpUser') || saveAttempted) && !smtp.user?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Your SMTP authentication username
									</p>
								</div>
								<div className="space-y-1.5 sm:space-y-2 min-w-0">
									<label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-700">
										<Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
										<span className="break-words">SMTP Password</span>
										<span className="text-red-600 font-bold">*</span>
										<div className="group relative flex-shrink-0">
											<HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 cursor-help" />
											<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
												<div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
													Your SMTP authentication password or API key
													<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
												</div>
											</div>
										</div>
									</label>
									<input
										type="password"
										value={smtp.pass}
										onChange={(e) => {
											setSmtp({ ...smtp, pass: e.target.value });
											setTouchedFields(prev => new Set(prev).add('smtpPass'));
										}}
										onBlur={() => setTouchedFields(prev => new Set(prev).add('smtpPass'))}
										placeholder="Your SMTP password"
										disabled={!isEditing}
										className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
											!isEditing
												? 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
												: (touchedFields.has('smtpPass') || saveAttempted) && !smtp.pass?.trim()
												? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-white text-slate-900'
												: 'border-slate-200 bg-white text-slate-900'
										}`}
									/>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-1.5 break-words">
										Required: Your SMTP authentication password or API key
									</p>
								</div>
							</div>

							<div className={`flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg sm:rounded-xl transition-all ${
								isEditing ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/50 border-slate-200'
							}`}>
								<input
									type="checkbox"
									checked={!!smtp.secure}
									onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })}
									disabled={!isEditing}
									className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 flex-shrink-0 touch-manipulation mt-0.5 sm:mt-0 ${
										isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
									}`}
								/>
								<div className="min-w-0 flex-1">
									<label className="text-xs sm:text-sm font-medium text-slate-700 cursor-pointer break-words block">
										Use SSL/TLS (port 465)
									</label>
									<p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 break-words">
										Enable for secure connections on port 465
									</p>
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						{isEditing && (
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 border-t border-slate-200">
							<button
								onClick={save}
								disabled={saving || loading || !isDirty}
								className={`flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 touch-manipulation min-h-[44px] ${
									saving || loading || !isDirty
										? 'bg-slate-200 text-slate-500 cursor-not-allowed'
										: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
								}`}
							>
								{saving ? (
									<>
										<RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
										<span className="whitespace-nowrap">Saving...</span>
									</>
								) : (
									<>
										<Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
										<span className="whitespace-nowrap">Save Settings</span>
									</>
								)}
							</button>
								
								<button
									onClick={handleCancel}
									disabled={saving || loading}
									className={`flex items-center justify-center gap-2 px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 touch-manipulation min-h-[44px] ${
										saving || loading
											? 'bg-slate-200 text-slate-500 cursor-not-allowed'
											: 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
									}`}
								>
									<X className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
									<span className="whitespace-nowrap">Cancel</span>
								</button>
							
							{notice && (
								<div
									className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium border transition-all duration-300 min-w-0 flex-1 sm:flex-initial ${
										notice.type === 'success'
											? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10'
											: 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-500/10'
									}`}
								>
									{notice.type === 'success' ? (
										<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
									) : (
										<AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
									)}
									<span className="break-words min-w-0">{notice.text}</span>
								</div>
							)}
							
							{!isDirty && !notice && (
								<div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-500">
									<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
									<span className="whitespace-nowrap">All changes saved</span>
								</div>
							)}
						</div>
						)}
						
						{/* Read-only mode status */}
						{!isEditing && !loading && (
							<div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-slate-500 pt-3 sm:pt-4 border-t border-slate-200">
								<CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
								<span className="whitespace-nowrap">View mode — Click &quot;Edit Settings&quot; to make changes</span>
							</div>
						)}
					</div>
				</div>
			</div>
			
			{/* Unsaved Changes Dialog */}
			<ConfirmDialog
				isOpen={showUnsavedDialog}
				title="Unsaved Changes"
				message="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
				confirmText="Leave Without Saving"
				cancelText="Stay on Page"
				confirmVariant="danger"
				onConfirm={handleConfirmNavigation}
				onCancel={handleCancelNavigation}
			/>
		</div>
	);
};

export default EmailConfigForm;


