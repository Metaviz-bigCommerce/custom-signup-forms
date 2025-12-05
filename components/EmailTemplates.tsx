'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Mail, Check, X, Send } from 'lucide-react';
import { useSession } from '@/context/session';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo';

type Design = {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  background?: string;
  title?: string;
  greeting?: string;
  buttonText?: string;
  actionUrl?: string;
  footerNote?: string;
  contactLinkText?: string;
  contactLinkUrl?: string;
  privacyLinkText?: string;
  privacyLinkUrl?: string;
  socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
};
type Template = { subject: string; body: string; html?: string | null; useHtml?: boolean | null; design?: Design };
type Templates = Record<TemplateKey, Template>;

const EmailTemplates: React.FC = () => {
  const { context } = useSession();
  const [emailTemplates, setEmailTemplates] = useState<Templates>({
    signup: { 
      subject: 'Notification from {{platform_name}}: Your Signup Request Has Been Received', 
      body: 'Hi {{name}},\nWe have received your signup request and initiated the review process. Our team is currently validating the information you provided to ensure it meets our account requirements. You will receive an update once this review is complete. If any clarification or additional details are needed, we will contact you directly. Thank you for your patience while we complete this verification step.' 
    },
    approval: { 
      subject: '{{platform_name}} Account Update: Your Application Has Been Approved', 
      body: 'Hi {{name}},\nYour signup request has been approved, and your account is now active. You may now log in to begin configuring your store and accessing your dashboard. We recommend reviewing the available onboarding resources to support your initial setup. Should you need any assistance during this process, our support team is available to help. Thank you for choosing our platform for your business operations.' 
    },
    rejection: { 
      subject: '{{platform_name}} Review Outcome: Status of Your Signup Request', 
      body: 'Hi {{name}},\nAfter a thorough review of your signup information, we are unable to approve your request at this time. This decision reflects the criteria required for account activation on our platform. If you have updated information or additional context that may support reconsideration, you are welcome to reply to this email. Our team will review any new details you provide. Thank you for your interest in our services and for taking the time to apply.' 
    },
    moreInfo: { 
      subject: 'Action Required from {{platform_name}}: Additional Details Needed to Proceed', 
      body: 'Hi {{name}},\nTo proceed with your signup review, we require the following information: {{required_information}}. Providing accurate details will help us complete the verification process efficiently. You may submit the requested information through your signup portal or by replying directly to this email. Once received, we will resume the review and update you accordingly. Please let us know if you need clarification regarding any part of this request.' 
    }
  });
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('signup');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
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
      const v = (renderVars as any)?.[key];
      return v == null ? '' : String(v);
    });

  const icon = (name: keyof NonNullable<Design['socials']>, color: string) => {
    const size = 20;
    const common = `width:${size}px;height:${size}px;display:inline-block;vertical-align:middle`;
    switch (name) {
      case 'facebook':
        return `<span style="${common};background:${color};border-radius:50%;text-decoration:none"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 4.99 3.66 9.13 8.44 9.94v-7.03H7.9V12h2.54V9.79c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.97h-2.34v7.03C18.34 21.19 22 17.05 22 12.06z"/></svg></span>`;
      case 'twitter':
        return `<span style="${common};background:${color};border-radius:50%;text-decoration:none"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.87-2.36 8.49 8.49 0 0 1-2.7 1.03 4.24 4.24 0 0 0-7.23 3.86A12.03 12.03 0 0 1 3.16 4.9a4.24 4.24 0 0 0 1.31 5.66 4.2 4.2 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.4 4.16 4.27 4.27 0 0 1-1.91.07 4.25 4.25 0 0 0 3.96 2.95A8.51 8.51 0 0 1 2 19.55a12 12 0 0 0 6.5 1.9c7.81 0 12.08-6.47 12.08-12.08l-.01-.55A8.64 8.64 0 0 0 22.46 6z"/></svg></span>`;
      case 'instagram':
        return `<span style="${common};background:${color};border-radius:4px;text-decoration:none"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M7 2C4.239 2 2 4.239 2 7v10c0 2.761 2.239 5 5 5h10c2.761 0 5-2.239 5-5V7c0-2.761-2.239-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm6-1a1 1 0 110 2 1 1 0 010-2zM12 9a3 3 0 110 6 3 3 0 010-6z"/></svg></span>`;
      case 'linkedin':
        return `<span style="${common};background:${color};border-radius:4px;text-decoration:none"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7 0h3.8v2.2h.06c.53-1 1.82-2.2 3.75-2.2 4 0 4.74 2.63 4.74 6v10h-4v-8.9c0-2.12-.04-4.86-2.96-4.86-2.96 0-3.41 2.31-3.41 4.71V24h-4V8z"/></svg></span>`;
      case 'youtube':
        return `<span style="${common};background:${color};border-radius:6px;text-decoration:none"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#fff"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.3 3.5 12 3.5 12 3.5s-7.3 0-9.4.6A3 3 0 0 0 .5 6.2 31.7 31.7 0 0 0 0 12a31.7 31.7 0 0 0 .6 5.8 3 3 0 0 0 2.1 2.1c2.1.6 9.4.6 9.4.6s7.3 0 9.4-.6a3 3 0 0 0 2.1-2.1c.4-1.9.6-3.9.6-5.8s-.2-3.9-.6-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z"/></svg></span>`;
      default:
        return '';
    }
  };

  const generateHtml = (t: Template) => {
    const d: Design = t.design || {};
    const brand = d.primaryColor || '#2563eb';
    const bg = d.background || '#f7fafc';
    const logo = d.logoUrl ? `<img src="${d.logoUrl}" alt="${renderTemplate('{{platform_name}}')}" style="max-width:200px;height:auto;display:block;margin:0 auto">` : `<div style="font-size:32px;font-weight:900;letter-spacing:.3px;color:${brand};text-align:center">${renderTemplate('{{platform_name}}')}</div>`;
    const banner = d.bannerUrl ? `<tr><td style="padding:0 24px 8px 24px"><img src="${d.bannerUrl}" alt="" style="width:100%;height:auto;border-radius:14px;display:block"></td></tr>` : '';
    const socials = d.socials || {};
    const socialsRow = Object.entries(socials).filter(([, url]) => !!url).length
      ? `<tr><td align="center" style="padding-top:8px;padding-bottom:8px">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                ${Object.entries(socials).map(([k, url]) => url ? `<td style="padding:0 6px"><a href="${url}" target="_blank">${icon(k as any, brand)}</a></td>` : '').join('')}
              </tr>
            </table>
         </td></tr>`
      : '';
    const ctaText = d.buttonText || 'View details';
    const ctaUrl = renderTemplate(d.actionUrl || '{{action_url}}');
    const footerNote = d.footerNote || 'This email was sent to {{email}}';
    const heading = (d.title || t.subject || renderTemplate('{{platform_name}}')).replace(/\{\{.*?\}\}/g, (m)=>renderTemplate(m));
    const greeting = (d.greeting || 'Hello {{name}}').replace(/\{\{.*?\}\}/g, (m)=>renderTemplate(m));
    const contactLinkText = d.contactLinkText || 'Contact us';
    const contactLinkUrl = d.contactLinkUrl || '#';
    const privacyLinkText = d.privacyLinkText || 'Privacy Policy';
    const privacyLinkUrl = d.privacyLinkUrl || '#';

    return `
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>${renderTemplate('{{platform_name}}')}</title>
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
          <tr>
            <td style="padding:0 24px">
              <div style="font-size:14px;color:#334155;text-align:center;margin-bottom:14px">${greeting},</div>
              <div style="font-size:14px;line-height:1.7;color:#334155;white-space:pre-line;text-align:center">${renderTemplate(t.body)}</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 24px 16px 24px">
              <a href="${ctaUrl}" style="display:inline-block;background:${brand};color:#ffffff;text-decoration:none;font-weight:800;letter-spacing:.2px;padding:13px 24px;border-radius:999px"> ${ctaText} </a>
            </td>
          </tr>
          <tr><td style="padding:0 24px">${socialsRow}</td></tr>
          <tr>
            <td style="padding:12px 24px 6px 24px">
              <div style="height:1px;background:#e5e7eb"></div>
            </td>
          </tr>
          <tr>
            <td style="font-size:12px;line-height:1.7;color:#64748b;padding:8px 24px 0 24px;text-align:center">
              ${renderTemplate(footerNote)}<br/>
              <a href="${contactLinkUrl}" style="color:${brand};text-decoration:underline">${contactLinkText}</a>
              &nbsp;|&nbsp;
              <a href="${privacyLinkUrl}" style="color:${brand};text-decoration:underline">${privacyLinkText}</a>
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
          if (json?.templates) setEmailTemplates(json.templates);
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
      // Generate HTML for all templates before saving
      const toSave: Templates = Object.fromEntries(
        (Object.keys(emailTemplates) as TemplateKey[]).map((k) => {
          const t = emailTemplates[k];
          const html = generateHtml(t);
          return [k, { ...t, html, useHtml: true }];
        })
      ) as Templates;
      await fetch(`/api/email-templates?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: toSave }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="h-5 w-28 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-5 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
                <div className="h-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-5 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Email Templates</h2>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-4">Select Template</h3>
          <div className="space-y-2">
            {[
              { key: 'signup', label: 'Signup Confirmation', icon: Send },
              { key: 'approval', label: 'Approval Email', icon: Check },
              { key: 'rejection', label: 'Rejection Email', icon: X },
              { key: 'moreInfo', label: 'Info Request', icon: Mail }
            ].map(template => (
              <button
                key={template.key}
                onClick={() => setSelectedTemplate(template.key as TemplateKey)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors border ${
                  selectedTemplate === (template.key as TemplateKey)
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <template.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{template.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Edit Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={emailTemplates[selectedTemplate].subject}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    [selectedTemplate]: { ...emailTemplates[selectedTemplate], subject: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none text-gray-900"
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Email Body</label>
                <textarea
                  value={emailTemplates[selectedTemplate].body}
                  onChange={(e) => setEmailTemplates({
                    ...emailTemplates,
                    [selectedTemplate]: { ...emailTemplates[selectedTemplate], body: e.target.value }
                  })}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none font-mono text-sm text-gray-900"
                  placeholder="Enter email content"
                />
              </div>

              {/* Visual Designer Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Title (big heading)</label>
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.title || ''}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), title: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g., Your Signup Request Has Been Approved"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Greeting</label>
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.greeting || 'Hello {{name}}'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), greeting: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="Hello {{name}}"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={emailTemplates[selectedTemplate].design?.logoUrl || ''}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), logoUrl: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="https://…/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={emailTemplates[selectedTemplate].design?.bannerUrl || ''}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), bannerUrl: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="https://…/banner.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={emailTemplates[selectedTemplate].design?.primaryColor || '#2563eb'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), primaryColor: e.target.value } }
                    })}
                    className="w-16 h-10 p-1 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Background</label>
                  <input
                    type="color"
                    value={emailTemplates[selectedTemplate].design?.background || '#f7fafc'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), background: e.target.value } }
                    })}
                    className="w-16 h-10 p-1 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.buttonText || 'View details'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), buttonText: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Button URL</label>
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.actionUrl || '{{action_url}}'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), actionUrl: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Themes */}
              <div className="pt-1">
                <div className="text-xs font-semibold text-gray-500 mb-2">Quick styles</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Sky', primaryColor: '#2563eb', background: '#f7fafc' },
                    { name: 'Emerald', primaryColor: '#059669', background: '#ecfdf5' },
                    { name: 'Rose', primaryColor: '#e11d48', background: '#fff1f2' },
                    { name: 'Slate', primaryColor: '#334155', background: '#f1f5f9' },
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
                      className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
                      style={{ color: t.primaryColor }}
                      title={`Primary ${t.primaryColor}, Background ${t.background}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Footer Note</label>
                  <input
                    type="text"
                    value={emailTemplates[selectedTemplate].design?.footerNote || 'This email was sent to {{email}}'}
                    onChange={(e) => setEmailTemplates({
                      ...emailTemplates,
                      [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), footerNote: e.target.value } }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Contact Link Text</label>
                    <input
                      type="text"
                      value={emailTemplates[selectedTemplate].design?.contactLinkText || 'Contact us'}
                      onChange={(e) => setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), contactLinkText: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Contact URL</label>
                    <input
                      type="text"
                      value={emailTemplates[selectedTemplate].design?.contactLinkUrl || '#'}
                      onChange={(e) => setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), contactLinkUrl: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Privacy Link Text</label>
                    <input
                      type="text"
                      value={emailTemplates[selectedTemplate].design?.privacyLinkText || 'Privacy Policy'}
                      onChange={(e) => setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), privacyLinkText: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Privacy URL</label>
                    <input
                      type="text"
                      value={emailTemplates[selectedTemplate].design?.privacyLinkUrl || '#'}
                      onChange={(e) => setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: { ...emailTemplates[selectedTemplate], design: { ...(emailTemplates[selectedTemplate].design||{}), privacyLinkUrl: e.target.value } }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['facebook','twitter','instagram','linkedin','youtube'] as const).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{key} URL</label>
                    <input
                      type="url"
                      value={emailTemplates[selectedTemplate].design?.socials?.[key] || ''}
                      onChange={(e) => setEmailTemplates({
                        ...emailTemplates,
                        [selectedTemplate]: {
                          ...emailTemplates[selectedTemplate],
                          design: { ...(emailTemplates[selectedTemplate].design||{}), socials: { ...(emailTemplates[selectedTemplate].design?.socials||{}), [key]: e.target.value } }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      placeholder={`https://${key}.com/...`}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Available Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {['{{name}}', '{{email}}', '{{date}}', '{{store_name}}', '{{platform_name}}', '{{required_information}}', '{{action_url}}'].map(variable => (
                    <code key={variable} className="px-3 py-1 bg-white border border-blue-300 rounded text-xs text-blue-700 font-mono">
                      {variable}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">Use these variables in your template. They will be replaced with actual values when emails are sent.</p>
              </div>

              <div className="flex gap-3">
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview Email
                </button>
                <button onClick={save} disabled={!loaded || saving} className={`px-6 py-3 rounded-lg font-medium transition-colors ${saving ? 'bg-emerald-300 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                  {saving ? 'Saving…' : 'Save Template'}
                </button>
                <button
                  onClick={async () => {
                    const to = prompt('Send a test email to:');
                    if (!to) return;
                    try {
                      const res = await fetch(`/api/email/test?context=${encodeURIComponent(context)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to, key: selectedTemplate }),
                      });
                      if (!res.ok) throw new Error(await res.text());
                      alert('Test email sent (if SMTP is configured). Check your inbox/spam.');
                    } catch (e: any) {
                      alert('Failed to send test: ' + (e?.message || 'Unknown error'));
                    }
                  }}
                  className="px-6 py-3 rounded-lg font-medium border border-gray-200 hover:bg-gray-50"
                >
                  Send Test
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Preview</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-0 overflow-hidden max-w-2xl">
                <iframe
                  title="email-preview"
                  sandbox=""
                  className="w-full h-[600px]"
                  srcDoc={generateHtml(emailTemplates[selectedTemplate])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;

