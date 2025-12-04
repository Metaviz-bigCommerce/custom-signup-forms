'use client'

import React, { useEffect, useState } from 'react';
import { Eye, Mail, Check, X, Send } from 'lucide-react';
import { useSession } from '@/context/session';

type TemplateKey = 'signup' | 'approval' | 'rejection' | 'moreInfo';

type Templates = Record<TemplateKey, { subject: string; body: string }>;

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
      await fetch(`/api/email-templates?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: emailTemplates }),
      });
    } finally {
      setSaving(false);
    }
  };

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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  selectedTemplate === (template.key as TemplateKey)
                    ? 'bg-blue-50 border-2 border-blue-400 text-blue-700'
                    : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent font-mono text-sm text-gray-900"
                  placeholder="Enter email content"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Available Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {['{{name}}', '{{email}}', '{{date}}', '{{store_name}}', '{{platform_name}}', '{{required_information}}'].map(variable => (
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
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Preview</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 max-w-2xl">
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Subject:</p>
                  <p className="text-base font-semibold text-gray-800">{emailTemplates[selectedTemplate].subject}</p>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{emailTemplates[selectedTemplate].body}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;

