'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import { Bell, Mail, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const NotificationConfig: React.FC = () => {
  const { context } = useSession();
  const toast = useToast();
  const [enabled, setEnabled] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [useCustomEmail, setUseCustomEmail] = useState(false);
  const [original, setOriginal] = useState<{ enabled: boolean; notifyEmail: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = {
    enabled,
    notifyEmail: useCustomEmail ? (notifyEmail.trim() || null) : null,
  };

  const isDirty = JSON.stringify(currentConfig) !== JSON.stringify(original || { enabled: true, notifyEmail: null });

  useEffect(() => {
    if (!context) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notification-config?context=${encodeURIComponent(context)}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to load notification configuration');
        }
        const json = await res.json();
        const cfg = json?.config || { enabled: true, notifyEmail: null };
        setEnabled(cfg.enabled);

        if (cfg.notifyEmail) {
          setUseCustomEmail(true);
          setNotifyEmail(cfg.notifyEmail);
        } else {
          setUseCustomEmail(false);
          setNotifyEmail('');
        }

        setOriginal(cfg);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load notification configuration';
        setError(message);
        toast.showError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [context, toast]);

  const handleSave = async () => {
    if (!context) return;

    // Validate email if custom email is enabled
    if (useCustomEmail && !notifyEmail.trim()) {
      toast.showWarning('Please provide a notification email address.');
      return;
    }

    if (useCustomEmail && notifyEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(notifyEmail.trim())) {
        toast.showWarning('Please provide a valid email address.');
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        enabled,
        notifyEmail: useCustomEmail ? (notifyEmail.trim() || null) : null,
      };

      const res = await fetch(`/api/notification-config?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to save settings');
      }

      setOriginal(payload);
      toast.showSuccess('Notification settings saved successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save notification configuration';
      setError(message);
      toast.showError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Bell className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-500">Configure who receives signup request notifications</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable/Disable Notifications */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-4">
          <label className="inline-flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center pt-0.5">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center ${
                enabled
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600'
                  : 'bg-gray-300'
              }`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </div>
            </div>
            <div>
              <span className={`text-base font-semibold transition-colors ${
                enabled ? 'text-amber-700' : 'text-gray-700'
              }`}>
                {enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
              </span>
              <p className="text-xs text-gray-600 mt-1">
                {enabled
                  ? "You'll receive an email when someone submits or resubmits a signup request"
                  : "No notifications will be sent for new signup requests"}
              </p>
            </div>
          </label>
        </div>

        {/* Email Configuration */}
        <div className={`space-y-4 transition-all duration-300 ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
            <Mail className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Notification Email</h3>
          </div>

          {/* Default vs Custom Email Toggle */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <label className="inline-flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomEmail}
                onChange={(e) => setUseCustomEmail(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Use custom notification email</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  By default, notifications are sent to your account email. Enable this to send notifications to a different address.
                </p>
              </div>
            </label>
          </div>

          {/* Custom Email Input */}
          {useCustomEmail && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                Custom Notification Email
              </label>
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="notifications@yourstore.com"
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                This email will receive notifications for all signup requests and resubmissions
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
              <strong className="text-gray-700">Note:</strong> Notification emails include request details and are sent immediately when a request is submitted or resubmitted.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              saving || loading || !isDirty
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {!isDirty && !loading && (
          <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>All changes saved</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationConfig;
