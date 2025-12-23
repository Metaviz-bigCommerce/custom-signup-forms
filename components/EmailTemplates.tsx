'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Eye, Mail, Check, X, Send, Palette, Type, Link2, 
  Share2, ChevronDown, ChevronRight, Sparkles, Save,
  TestTube, RefreshCw, MousePointer, Plus, Trash2, GripVertical
} from 'lucide-react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import TestEmailModal from '@/components/TestEmailModal';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo';

type CTA = {
  id: string;
  text: string;
  url: string;
};

type FooterLink = {
  id: string;
  text: string;
  url: string;
};

type SocialLink = {
  id: string;
  name: string;
  url: string;
  iconUrl: string;
};

type Design = {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  background?: string;
  title?: string;
  greeting?: string;
  ctas?: CTA[];
  footerNote?: string;
  footerLinks?: FooterLink[];
  socialLinks?: SocialLink[];
};
type Template = { subject: string; body: string; html?: string | null; useHtml?: boolean | null; design?: Design };
type Templates = Record<TemplateKey, Template>;

// Helper to determine if a color is light or dark for text contrast
const isLightColor = (hex: string): boolean => {
  const color = hex.replace('#', '');
  if (color.length !== 6) return false;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
};

const templateMeta: Record<TemplateKey, { label: string; icon: React.ElementType; description: string; color: string; bgColor: string }> = {
  signup: { 
    label: 'Signup Confirmation', 
    icon: Send, 
    description: 'Sent when a user submits the signup form',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500'
  },
  approval: { 
    label: 'Approval Email', 
    icon: Check, 
    description: 'Sent when you approve a signup request',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500'
  },
  rejection: { 
    label: 'Rejection Email', 
    icon: X, 
    description: 'Sent when you reject a signup request',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500'
  },
  moreInfo: { 
    label: 'Info Request', 
    icon: Mail, 
    description: 'Sent when you request additional information',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500'
  }
};

// Default footer links
const defaultFooterLinks: FooterLink[] = [
  { id: 'contact', text: 'Contact Us', url: '#' },
  { id: 'privacy', text: 'Privacy Policy', url: '#' }
];

// Pre-configured social media platforms (optional quick-add)
const presetSocialPlatforms: { name: string; iconUrl: string }[] = [
  { name: 'Facebook', iconUrl: 'https://cdn.simpleicons.org/facebook/1877F2' },
  { name: 'Twitter/X', iconUrl: 'https://cdn.simpleicons.org/x/000000' },
  { name: 'Instagram', iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F' },
  { name: 'LinkedIn', iconUrl: 'https://cdn.simpleicons.org/linkedin/0A66C2' },
  { name: 'YouTube', iconUrl: 'https://cdn.simpleicons.org/youtube/FF0000' }
];

// Default CTAs per template type
const defaultCTAs: Record<TemplateKey, CTA[]> = {
  signup: [{ id: 'view-status', text: 'Check Application Status', url: '{{action_url}}' }],
  approval: [{ id: 'login', text: 'Login to Your Account', url: '{{action_url}}' }],
  rejection: [{ id: 'contact', text: 'Contact Support', url: '{{action_url}}' }],
  moreInfo: [] // No default CTA - users will reply via email
};

// Default titles per template type
const defaultTitles: Record<TemplateKey, string> = {
  signup: 'Application Received Successfully',
  approval: 'Welcome Aboard! You\'re Approved',
  rejection: 'Application Status Update',
  moreInfo: 'We Need a Little More Information'
};

// Default branding colors per template type
const defaultBranding: Record<TemplateKey, { primaryColor: string; background: string }> = {
  signup: { primaryColor: '#2563eb', background: '#f7fafc' }, // Sky blue
  approval: { primaryColor: '#059669', background: '#ecfdf5' }, // Emerald green
  rejection: { primaryColor: '#e11d48', background: '#fff1f2' }, // Rose red
  moreInfo: { primaryColor: '#d97706', background: '#fffbeb' } // Amber
};

const EmailTemplates: React.FC = () => {
  const { context } = useSession();
  const toast = useToast();
  const [emailTemplates, setEmailTemplates] = useState<Templates>({
    signup: { 
      subject: 'Notification from {{platform_name}}: Your Signup Request Has Been Received', 
      body: 'We have received your signup request and initiated the review process. Our team is currently validating the information you provided to ensure it meets our account requirements. You will receive an update once this review is complete. If any clarification or additional details are needed, we will contact you directly. Thank you for your patience while we complete this verification step.',
      design: {
        title: defaultTitles.signup,
        primaryColor: defaultBranding.signup.primaryColor,
        background: defaultBranding.signup.background,
        ctas: defaultCTAs.signup,
        footerLinks: defaultFooterLinks
      }
    },
    approval: { 
      subject: '{{platform_name}} Account Update: Your Application Has Been Approved', 
      body: 'Your signup request has been approved, and your account is now active. You may now log in to begin configuring your store and accessing your dashboard. We recommend reviewing the available onboarding resources to support your initial setup. Should you need any assistance during this process, our support team is available to help. Thank you for choosing our platform for your business operations.',
      design: {
        title: defaultTitles.approval,
        primaryColor: defaultBranding.approval.primaryColor,
        background: defaultBranding.approval.background,
        ctas: defaultCTAs.approval,
        footerLinks: defaultFooterLinks
      }
    },
    rejection: { 
      subject: '{{platform_name}} Review Outcome: Status of Your Signup Request', 
      body: 'After a thorough review of your signup information, we are unable to approve your request at this time. This decision reflects the criteria required for account activation on our platform. If you have updated information or additional context that may support reconsideration, you are welcome to reply to this email. Our team will review any new details you provide. Thank you for your interest in our services and for taking the time to apply.',
      design: {
        title: defaultTitles.rejection,
        primaryColor: defaultBranding.rejection.primaryColor,
        background: defaultBranding.rejection.background,
        ctas: defaultCTAs.rejection,
        footerLinks: defaultFooterLinks
      }
    },
    moreInfo: { 
      subject: 'Action Required from {{platform_name}}: Additional Details Needed to Proceed', 
      body: 'To proceed with your signup review, we require the following information: {{required_information}}. Providing accurate details will help us complete the verification process efficiently. You may submit the requested information through your signup portal or by replying directly to this email. Once received, we will resume the review and update you accordingly. Please let us know if you need clarification regarding any part of this request.',
      design: {
        title: defaultTitles.moreInfo,
        primaryColor: defaultBranding.moreInfo.primaryColor,
        background: defaultBranding.moreInfo.background,
        ctas: defaultCTAs.moreInfo,
        footerLinks: defaultFooterLinks
      }
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('signup');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    branding: false,
    button: false,
    footer: false,
    socials: false
  });

  const renderVars = useMemo(() => ({
    name: 'John Doe',
    email: 'john@example.com',
    date: new Date().toLocaleString(),
    store_name: 'Demo Store',
    platform_name: 'SignupPro',
    required_information: 'Business license and tax ID',
    action_url: 'https://example.com/action'
  }), []);

  const renderTemplate = (input: string) =>
    String(input || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
      const v = (renderVars as Record<string, string>)?.[key];
      return v == null ? '' : String(v);
    });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generateHtml = (t: Template) => {
    const d: Design = t.design || {};
    const brand = d.primaryColor || '#2563eb';
    const bg = d.background || '#f7fafc';
    const logo = d.logoUrl ? `<img src="${d.logoUrl}" alt="${renderTemplate('{{platform_name}}')}" style="max-width:200px;height:auto;display:block;margin:0 auto">` : `<div style="font-size:32px;font-weight:900;letter-spacing:.3px;color:${brand};text-align:center">${renderTemplate('{{platform_name}}')}</div>`;
    const banner = d.bannerUrl ? `<tr><td style="padding:0 24px 8px 24px"><img src="${d.bannerUrl}" alt="" style="width:100%;height:auto;border-radius:14px;display:block"></td></tr>` : '';
    
    // Generate CTAs row (optional, can have multiple)
    const ctas = d.ctas || [];
    const ctasRow = ctas.length > 0
      ? `<tr>
            <td align="center" style="padding:20px 24px 16px 24px">
              ${ctas.map(cta => `<a href="${renderTemplate(cta.url)}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:800;letter-spacing:.2px;padding:13px 24px;border-radius:999px;margin:4px 6px"> ${cta.text} </a>`).join('')}
            </td>
          </tr>`
      : '';
    
    // Generate social links row (custom icons)
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
    
    // Generate footer links row (optional, can have multiple)
    const footerLinks = d.footerLinks || [];
    const footerLinksHtml = footerLinks.length > 0
      ? footerLinks.map(link => `<a href="${link.url}" style="color:${brand};text-decoration:underline">${link.text}</a>`).join(' &nbsp;|&nbsp; ')
      : '';
    
    const footerNote = d.footerNote || 'This email was sent to {{email}}';
    const heading = (d.title || defaultTitles[selectedTemplate] || renderTemplate('{{platform_name}}')).replace(/\{\{.*?\}\}/g, (m)=>renderTemplate(m));
    const greeting = (d.greeting || 'Hello {{name}}').replace(/\{\{.*?\}\}/g, (m)=>renderTemplate(m));

    return `
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${renderTemplate('{{platform_name}}')}</title>
<style>
  :root { --brand: ${brand}; --bg: ${bg}; }
  /* Disable all link interactions in preview */
  a { pointer-events: none; cursor: default; }
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
          <tr>
            <td style="padding:0 24px">
              <div style="font-size:14px;color:#334155;text-align:center;margin-bottom:14px">${greeting},</div>
              <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${renderTemplate(t.body)}</div>
            </td>
          </tr>
          ${ctasRow}
          ${socialsRow}
          <tr>
            <td style="padding:12px 24px 6px 24px">
              <div style="height:1px;background:#e5e7eb"></div>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.7;color:#64748b;padding:8px 24px 0 24px;text-align:center">
              ${renderTemplate(footerNote)}${footerLinksHtml ? '<br/>' + footerLinksHtml : ''}
              <div style="padding-top:6px;color:#94a3b8">Sent by ${renderTemplate('{{store_name}}')} · ${renderTemplate('{{date}}')}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding:24px 0;"></td></tr>
  </table>
</body></html>
`.trim();
  };

  useEffect(() => {
    const load = async () => {
      if (!context) return;
      try {
        const res = await fetch(`/api/email-templates?context=${encodeURIComponent(context)}`);
        if (res.ok) {
          const json = await res.json();
          // API returns { error: false, data: { templates } }
          const templates = json?.data?.templates || json?.templates;
          if (templates) {
            // Merge loaded templates with defaults to ensure all required fields and branding are present
            const defaultTemplates: Templates = {
              signup: { 
                subject: 'Notification from {{platform_name}}: Your Signup Request Has Been Received', 
                body: 'We have received your signup request and initiated the review process. Our team is currently validating the information you provided to ensure it meets our account requirements. You will receive an update once this review is complete. If any clarification or additional details are needed, we will contact you directly. Thank you for your patience while we complete this verification step.',
                design: {
                  title: defaultTitles.signup,
                  primaryColor: defaultBranding.signup.primaryColor,
                  background: defaultBranding.signup.background,
                  ctas: defaultCTAs.signup,
                  footerLinks: defaultFooterLinks
                }
              },
              approval: { 
                subject: '{{platform_name}} Account Update: Your Application Has Been Approved', 
                body: 'Your signup request has been approved, and your account is now active. You may now log in to begin configuring your store and accessing your dashboard. We recommend reviewing the available onboarding resources to support your initial setup. Should you need any assistance during this process, our support team is available to help. Thank you for choosing our platform for your business operations.',
                design: {
                  title: defaultTitles.approval,
                  primaryColor: defaultBranding.approval.primaryColor,
                  background: defaultBranding.approval.background,
                  ctas: defaultCTAs.approval,
                  footerLinks: defaultFooterLinks
                }
              },
              rejection: { 
                subject: '{{platform_name}} Review Outcome: Status of Your Signup Request', 
                body: 'After a thorough review of your signup information, we are unable to approve your request at this time. This decision reflects the criteria required for account activation on our platform. If you have updated information or additional context that may support reconsideration, you are welcome to reply to this email. Our team will review any new details you provide. Thank you for your interest in our services and for taking the time to apply.',
                design: {
                  title: defaultTitles.rejection,
                  primaryColor: defaultBranding.rejection.primaryColor,
                  background: defaultBranding.rejection.background,
                  ctas: defaultCTAs.rejection,
                  footerLinks: defaultFooterLinks
                }
              },
              moreInfo: { 
                subject: 'Action Required from {{platform_name}}: Additional Details Needed to Proceed', 
                body: 'To proceed with your signup review, we require the following information: {{required_information}}. Providing accurate details will help us complete the verification process efficiently. You may submit the requested information through your signup portal or by replying directly to this email. Once received, we will resume the review and update you accordingly. Please let us know if you need clarification regarding any part of this request.',
                design: {
                  title: defaultTitles.moreInfo,
                  primaryColor: defaultBranding.moreInfo.primaryColor,
                  background: defaultBranding.moreInfo.background,
                  ctas: defaultCTAs.moreInfo,
                  footerLinks: defaultFooterLinks
                }
              }
            };
            
            const merged: Templates = Object.fromEntries(
              (Object.keys(defaultTemplates) as TemplateKey[]).map((k) => {
                const loaded = templates[k];
                const defaultTemplate = defaultTemplates[k];
                
                // If loaded template exists, merge it with defaults
                if (loaded) {
                  return [k, {
                    // Use saved values, fallback to defaults
                    subject: loaded.subject ?? defaultTemplate.subject,
                    body: loaded.body ?? defaultTemplate.body,
                    html: loaded.html ?? null,
                    useHtml: loaded.useHtml ?? true,
                    design: loaded.design ? {
                      // Merge design: use saved values, fallback to defaults only if not set
                      title: loaded.design.title ?? defaultTemplate.design?.title,
                      greeting: loaded.design.greeting ?? defaultTemplate.design?.greeting,
                      primaryColor: loaded.design.primaryColor ?? defaultTemplate.design?.primaryColor ?? defaultBranding[k].primaryColor,
                      background: loaded.design.background ?? defaultTemplate.design?.background ?? defaultBranding[k].background,
                      logoUrl: loaded.design.logoUrl ?? defaultTemplate.design?.logoUrl,
                      bannerUrl: loaded.design.bannerUrl ?? defaultTemplate.design?.bannerUrl,
                      footerNote: loaded.design.footerNote ?? defaultTemplate.design?.footerNote,
                      // Use saved arrays if they exist (even if empty), otherwise use defaults
                      ctas: loaded.design.ctas !== undefined ? loaded.design.ctas : (defaultTemplate.design?.ctas || []),
                      footerLinks: loaded.design.footerLinks !== undefined ? loaded.design.footerLinks : (defaultTemplate.design?.footerLinks || []),
                      socialLinks: loaded.design.socialLinks !== undefined ? loaded.design.socialLinks : (defaultTemplate.design?.socialLinks || []),
                    } : defaultTemplate.design,
                  }];
                } else {
                  // No saved template, use default
                  return [k, defaultTemplate];
                }
              })
            ) as Templates;
            setEmailTemplates(merged);
          }
        }
      } catch {}
      setLoaded(true);
    };
    load();
  }, [context]);

  const save = async () => {
    if (!context) return;
    setSaving(true);
    try {
      // Save templates with design - HTML will be generated on-the-fly when sending emails with actual user variables
      const toSave: Templates = Object.fromEntries(
        (Object.keys(emailTemplates) as TemplateKey[]).map((k) => {
          const t = emailTemplates[k];
          // Don't generate HTML with preview vars - save design and let email sending generate HTML with actual vars
          return [k, { ...t, useHtml: true }];
        })
      ) as Templates;
      await fetch(`/api/email-templates?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: toSave }),
      });
      toast.showSuccess('Templates saved successfully!');
    } catch {
      toast.showError('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const currentMeta = templateMeta[selectedTemplate];
  const CurrentIcon = currentMeta.icon;

  // Collapsible Section Component
  const Section = ({ 
    id, 
    title, 
    icon: SectionIcon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode 
  }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <SectionIcon className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700 text-sm">{title}</span>
        </div>
        {expandedSections[id] ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="p-4 space-y-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-8">
          <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded mt-3 animate-pulse" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="col-span-7">
            <div className="h-[600px] bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold !text-white">Email Templates</h1>
                  <p className="text-slate-400 text-sm">Design beautiful emails for your customers</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTestEmailModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-all cursor-pointer border border-white/10"
              >
                <TestTube className="w-4 h-4" />
                Send Test
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all cursor-pointer shadow-lg shadow-white/25 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save All Templates
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Template Selector Pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {(Object.keys(templateMeta) as TemplateKey[]).map((key) => {
              const meta = templateMeta[key];
              const Icon = meta.icon;
              const isSelected = selectedTemplate === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTemplate(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-lg shadow-white/25'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Editor Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Current Template Info - Uses user's primary color with adaptive text */}
          {(() => {
            const primaryColor = emailTemplates[selectedTemplate].design?.primaryColor || '#2563eb';
            const isLight = isLightColor(primaryColor);
            const textColor = isLight ? '#1e293b' : '#ffffff';
            const textColorMuted = isLight ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)';
            const iconBg = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)';
            return (
          <div 
            className="rounded-xl p-4 transition-colors duration-300"
                style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: iconBg }}
                  >
                    <CurrentIcon className="w-5 h-5" style={{ color: textColor }} />
              </div>
              <div>
                    <h3 className="font-semibold" style={{ color: textColor }}>{currentMeta.label}</h3>
                    <p className="text-sm" style={{ color: textColorMuted }}>{currentMeta.description}</p>
              </div>
            </div>
          </div>
            );
          })()}

          {/* Content Section */}
          <Section id="content" title="Email Content" icon={Type}>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Subject Line</label>
              <p className="text-xs text-slate-400 mb-2">Appears in the recipient&apos;s inbox</p>
              <input
                type="text"
                value={emailTemplates[selectedTemplate].subject}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], subject: e.target.value }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
                placeholder="Enter email subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Email Title</label>
              <p className="text-xs text-slate-400 mb-2">Main heading displayed inside the email</p>
              <input
                type="text"
                value={emailTemplates[selectedTemplate].design?.title ?? ''}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), title: e.target.value } }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
                placeholder={defaultTitles[selectedTemplate]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Greeting</label>
              <input
                type="text"
                value={emailTemplates[selectedTemplate].design?.greeting || 'Hello {{name}}'}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), greeting: e.target.value } }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
                placeholder="Hello {{name}}"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Email Body</label>
              <textarea
                value={emailTemplates[selectedTemplate].body}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], body: e.target.value }
                })}
                rows={8}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all resize-none"
                placeholder="Enter email content"
              />
            </div>

            {/* Variables */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-800">Available Variables</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['{{name}}', '{{email}}', '{{date}}', '{{store_name}}', '{{platform_name}}', '{{required_information}}'].map(v => (
                  <code key={v} className="px-2 py-1 bg-white border border-blue-200 rounded text-[11px] text-blue-700 font-mono">
                    {v}
                  </code>
                ))}
              </div>
            </div>
          </Section>

          {/* Branding Section */}
          <Section id="branding" title="Branding & Colors" icon={Palette}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={emailTemplates[selectedTemplate].design?.primaryColor || '#2563eb'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), primaryColor: e.target.value } }
                    })}
                    className="w-12 h-10 p-1 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.primaryColor || '#2563eb'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), primaryColor: e.target.value } }
                    })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={emailTemplates[selectedTemplate].design?.background || '#f7fafc'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), background: e.target.value } }
                    })}
                    className="w-12 h-10 p-1 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.background || '#f7fafc'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), background: e.target.value } }
                    })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Quick Themes</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Sky', primaryColor: '#2563eb', background: '#f7fafc' },
                  { name: 'Emerald', primaryColor: '#059669', background: '#ecfdf5' },
                  { name: 'Rose', primaryColor: '#e11d48', background: '#fff1f2' },
                  { name: 'Slate', primaryColor: '#334155', background: '#f1f5f9' },
                  { name: 'Purple', primaryColor: '#7c3aed', background: '#faf5ff' },
                ].map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: {
                        ...emailTemplates[selectedTemplate],
                        design: {
                          ...(emailTemplates[selectedTemplate].design || {}),
                          primaryColor: t.primaryColor,
                          background: t.background,
                        }
                      }
                    })}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm transition-colors cursor-pointer"
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primaryColor }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Logo URL</label>
              <input
                type="url"
                value={emailTemplates[selectedTemplate].design?.logoUrl || ''}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), logoUrl: e.target.value } }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
                placeholder="https://your-domain.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Banner Image URL</label>
              <input
                type="url"
                value={emailTemplates[selectedTemplate].design?.bannerUrl || ''}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), bannerUrl: e.target.value } }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
                placeholder="https://your-domain.com/banner.jpg"
              />
            </div>
          </Section>

          {/* CTA Buttons Section */}
          <Section id="button" title="Call-to-Action Buttons" icon={MousePointer}>
            <div className="space-y-3">
              {(emailTemplates[selectedTemplate].design?.ctas || []).map((cta, index) => (
                <div key={cta.id} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="pt-2">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Button Text</label>
                <input
                  type="text"
                        value={cta.text}
                        onChange={(e) => {
                          const newCtas = [...(emailTemplates[selectedTemplate].design?.ctas || [])];
                          newCtas[index] = { ...newCtas[index], text: e.target.value };
                          setEmailTemplates({
                    ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), ctas: newCtas } }
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Button text"
                />
              </div>
              <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Button URL</label>
                <input
                  type="text"
                        value={cta.url}
                        onChange={(e) => {
                          const newCtas = [...(emailTemplates[selectedTemplate].design?.ctas || [])];
                          newCtas[index] = { ...newCtas[index], url: e.target.value };
                          setEmailTemplates({
                    ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), ctas: newCtas } }
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="https://... or {{action_url}}"
                />
              </div>
                  </div>
                  <button
                    onClick={() => {
                      const newCtas = (emailTemplates[selectedTemplate].design?.ctas || []).filter((_, i) => i !== index);
                      setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), ctas: newCtas } }
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {(emailTemplates[selectedTemplate].design?.ctas || []).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No buttons added. Buttons are optional.
                </div>
              )}
              
              <button
                onClick={() => {
                  const newCta: CTA = { id: `cta-${Date.now()}`, text: 'Learn More', url: '{{action_url}}' };
                  const currentCtas = emailTemplates[selectedTemplate].design?.ctas || [];
                  setEmailTemplates({
                    ...emailTemplates,
                    [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), ctas: [...currentCtas, newCta] } }
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Button
              </button>
            </div>
          </Section>

          {/* Footer Section */}
          <Section id="footer" title="Footer & Links" icon={Link2}>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Footer Note</label>
              <input
                type="text"
                value={emailTemplates[selectedTemplate].design?.footerNote || 'This email was sent to {{email}}'}
                onChange={(e) => setEmailTemplates({
                  ...emailTemplates,
                  [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerNote: e.target.value } }
                })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
              />
            </div>
            
              <div>
              <label className="block text-sm font-medium text-slate-600 mb-3">Footer Links</label>
              <div className="space-y-2">
                {(emailTemplates[selectedTemplate].design?.footerLinks || []).map((link, index) => (
                  <div key={link.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...(emailTemplates[selectedTemplate].design?.footerLinks || [])];
                          newLinks[index] = { ...newLinks[index], text: e.target.value };
                          setEmailTemplates({
                    ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerLinks: newLinks } }
                          });
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Link text"
                />
                <input
                  type="text"
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...(emailTemplates[selectedTemplate].design?.footerLinks || [])];
                          newLinks[index] = { ...newLinks[index], url: e.target.value };
                          setEmailTemplates({
                    ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerLinks: newLinks } }
                          });
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
                    <button
                      onClick={() => {
                        const newLinks = (emailTemplates[selectedTemplate].design?.footerLinks || []).filter((_, i) => i !== index);
                        setEmailTemplates({
                    ...emailTemplates,
                          [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerLinks: newLinks } }
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {(emailTemplates[selectedTemplate].design?.footerLinks || []).length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No footer links. Links are optional.
                  </div>
                )}
                
                <button
                  onClick={() => {
                    const newLink: FooterLink = { id: `link-${Date.now()}`, text: 'New Link', url: '#' };
                    const currentLinks = emailTemplates[selectedTemplate].design?.footerLinks || [];
                    setEmailTemplates({
                    ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerLinks: [...currentLinks, newLink] } }
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Footer Link
                </button>
              </div>
            </div>
          </Section>

          {/* Socials Section */}
          <Section id="socials" title="Social Media Links" icon={Share2}>
            <div className="space-y-3">
              {(emailTemplates[selectedTemplate].design?.socialLinks || []).map((social, index) => (
                <div key={social.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    {/* Icon Preview */}
                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {social.iconUrl ? (
                        <img src={social.iconUrl} alt={social.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-xs font-bold text-slate-400">?</span>
                      )}
                  </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={social.name}
                          onChange={(e) => {
                            const newSocials = [...(emailTemplates[selectedTemplate].design?.socialLinks || [])];
                            newSocials[index] = { ...newSocials[index], name: e.target.value };
                            setEmailTemplates({
                              ...emailTemplates,
                              [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: newSocials } }
                            });
                          }}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="Platform name"
                        />
                  <input
                    type="url"
                          value={social.url}
                          onChange={(e) => {
                            const newSocials = [...(emailTemplates[selectedTemplate].design?.socialLinks || [])];
                            newSocials[index] = { ...newSocials[index], url: e.target.value };
                            setEmailTemplates({
                      ...emailTemplates,
                              [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: newSocials } }
                            });
                          }}
                          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                      <input
                        type="url"
                        value={social.iconUrl}
                        onChange={(e) => {
                          const newSocials = [...(emailTemplates[selectedTemplate].design?.socialLinks || [])];
                          newSocials[index] = { ...newSocials[index], iconUrl: e.target.value };
                          setEmailTemplates({
                            ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: newSocials } }
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Icon URL (PNG, SVG, etc.)"
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        const newSocials = (emailTemplates[selectedTemplate].design?.socialLinks || []).filter((_, i) => i !== index);
                        setEmailTemplates({
                          ...emailTemplates,
                          [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: newSocials } }
                        });
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {(emailTemplates[selectedTemplate].design?.socialLinks || []).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No social links added. Add your social media profiles.
                </div>
              )}
              
              {/* Quick add preset platforms */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Quick Add Popular Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {presetSocialPlatforms.map((preset) => {
                    const alreadyAdded = (emailTemplates[selectedTemplate].design?.socialLinks || []).some(
                      s => s.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        disabled={alreadyAdded}
                        onClick={() => {
                          const newSocial: SocialLink = { 
                            id: `social-${Date.now()}`, 
                            name: preset.name, 
                            url: '', 
                            iconUrl: preset.iconUrl 
                          };
                          const currentSocials = emailTemplates[selectedTemplate].design?.socialLinks || [];
                          setEmailTemplates({
                            ...emailTemplates,
                            [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: [...currentSocials, newSocial] } }
                          });
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer ${
                          alreadyAdded 
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <img src={preset.iconUrl} alt={preset.name} className="w-4 h-4" />
                        {preset.name}
                        {alreadyAdded && <Check className="w-3 h-3 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-3">
                <button
                  onClick={() => {
                    const newSocial: SocialLink = { id: `social-${Date.now()}`, name: '', url: '', iconUrl: '' };
                    const currentSocials = emailTemplates[selectedTemplate].design?.socialLinks || [];
                    setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), socialLinks: [...currentSocials, newSocial] } }
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Social Link
                </button>
              </div>
              
              {/* Helper tip */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <span className="font-semibold">Tip:</span> For custom platforms, use square icons (24x24px recommended). You can use URLs from your CDN or
                    <span className="font-mono mx-1">simpleicons.org</span> for brand icons.
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Preview Panel */}
        <div className="col-span-12 lg:col-span-8">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              {/* Preview Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Live Preview</h3>
                      <p className="text-xs text-slate-500">Changes update in real-time</p>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div> */}
                </div>
              </div>

              {/* Preview Content */}
              <div className="bg-slate-100 p-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <iframe
                    title="email-preview"
                    sandbox=""
                    className="w-full h-[650px]"
                    srcDoc={generateHtml(emailTemplates[selectedTemplate])}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={showTestEmailModal}
        templateKey={selectedTemplate}
        context={context || ''}
        onClose={() => setShowTestEmailModal(false)}
        showToast={toast}
      />
    </div>
  );
};

export default EmailTemplates;
