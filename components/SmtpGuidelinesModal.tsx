'use client'

import React from 'react';
import { X, Mail, Server, User, Lock, Settings, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

export interface SmtpGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SmtpGuidelinesModal: React.FC<SmtpGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b border-gray-200 flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">SMTP Configuration Guide</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Complete guide to setting up email delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex-1 overflow-y-auto">
          <div className="prose prose-sm sm:prose-base max-w-none">
            
            {/* Introduction */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                Introduction
              </h3>
              <div className="space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed">
                <p>
                  <strong>SMTP (Simple Mail Transfer Protocol)</strong> is the standard protocol used for sending emails across the internet. In this application, SMTP is required to send customer emails, including signup confirmations, approval notifications, and information requests.
                </p>
                <p>
                  Without proper SMTP configuration, your application will not be able to send any customer emails. This means customers won&apos;t receive important notifications about their signup requests, which can lead to a poor user experience and potential loss of business.
                </p>
                <p>
                  This guide will walk you through everything you need to know to configure SMTP correctly and ensure reliable email delivery for your custom signup forms.
                </p>
              </div>
            </section>

            {/* How the SMTP Flow Works */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600 flex-shrink-0" />
                How the SMTP Flow Works in This App
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-4">
                <ol className="space-y-3 text-sm sm:text-base text-gray-700 list-decimal list-inside">
                  <li>
                    <strong>Enter SMTP Credentials:</strong> Navigate to the <strong>Email Settings</strong> tab in your dashboard and fill in all required SMTP fields (host, port, username, password, etc.).
                  </li>
                  <li>
                    <strong>Save Settings:</strong> Click the <strong>&quot;Save Settings&quot;</strong> button to store your configuration. The system will validate your SMTP credentials at this point.
                  </li>
                  <li>
                    <strong>Email Delivery:</strong> Once validated and saved, customer emails will automatically be sent using these SMTP settings whenever a signup request is processed.
                  </li>
                  <li>
                    <strong>Validation Check:</strong> If your SMTP configuration is invalid or incomplete, the system will prevent saving, and no customer emails will be sent until the issue is resolved.
                  </li>
                </ol>
              </div>
            </section>

            {/* Which SMTP Details Are Needed */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600 flex-shrink-0" />
                Which SMTP Details Are Needed
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">From Email</h4>
                      <p className="text-sm text-gray-700">The email address that will appear as the sender of customer emails. This should be a valid email address from your domain (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">noreply@yourdomain.com</code>).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">From Name</h4>
                      <p className="text-sm text-gray-700">The display name that recipients will see in their email client (e.g., &quot;Your Store Name&quot; or &quot;Customer Support&quot;).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Reply-To Email</h4>
                      <p className="text-sm text-gray-700">The email address where replies to customer emails will be sent. This can be the same as your From Email or a different address (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">support@yourdomain.com</code>).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Server className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SMTP Host</h4>
                      <p className="text-sm text-gray-700">The hostname of your SMTP server. This is provided by your email service provider (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">smtp.hostinger.com</code> or <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">smtp-relay.brevo.com</code>).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SMTP Port</h4>
                      <p className="text-sm text-gray-700">The port number used for SMTP connections. Common ports are:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-4 text-sm text-gray-700">
                        <li><code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">587</code> - For TLS/STARTTLS (recommended)</li>
                        <li><code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">465</code> - For SSL</li>
                        <li><code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">25</code> - For unencrypted (not recommended)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SMTP Username</h4>
                      <p className="text-sm text-gray-700">Your SMTP authentication username. This is typically your full email address (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">noreply@yourdomain.com</code>).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SMTP Password</h4>
                      <p className="text-sm text-gray-700">Your SMTP authentication password. This may be your email account password or a specific application password generated by your email provider. Keep this secure and never share it.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3 mb-2">
                    <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">SSL/TLS</h4>
                      <p className="text-sm text-gray-700">A security toggle that enables encrypted connections. Enable this checkbox when using port 465 (SSL) or port 587 (TLS). Most modern email providers require encryption for security.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recommended SMTP Provider Setup */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                Recommended SMTP Provider Setup: Hostinger
              </h3>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-4">
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  Hostinger is a popular choice for domain-based email hosting. Follow these steps to obtain your SMTP credentials:
                </p>
                <ol className="space-y-4 text-sm sm:text-base text-gray-700 list-decimal list-inside">
                  <li>
                    <strong>Access Your Email Account:</strong>
                    <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                      <li>Log in to your Hostinger control panel (hPanel)</li>
                      <li>Navigate to <strong>Email</strong> section</li>
                      <li>Create a new email account or select an existing one (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">noreply@yourdomain.com</code>)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Find SMTP Settings:</strong>
                    <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                      <li>In the email account settings, look for <strong>&quot;Email Client Configuration&quot;</strong> or <strong>&quot;SMTP Settings&quot;</strong></li>
                      <li>You&apos;ll find the SMTP server details listed there</li>
                    </ul>
                  </li>
                  <li>
                    <strong>SMTP Configuration Values:</strong>
                    <div className="bg-white p-3 rounded-lg mt-2 ml-6 border border-gray-300">
                      <ul className="space-y-2 text-xs sm:text-sm font-mono">
                        <li><strong>SMTP Host:</strong> <code className="bg-gray-100 px-2 py-1 rounded">smtp.hostinger.com</code></li>
                        <li><strong>SMTP Port:</strong> <code className="bg-gray-100 px-2 py-1 rounded">465</code> (SSL) or <code className="bg-gray-100 px-2 py-1 rounded">587</code> (TLS)</li>
                        <li><strong>SMTP Username:</strong> Your full email address (e.g., <code className="bg-gray-100 px-2 py-1 rounded">noreply@yourdomain.com</code>)</li>
                        <li><strong>SMTP Password:</strong> Your email account password</li>
                        <li><strong>SSL/TLS:</strong> Enable this checkbox</li>
                      </ul>
                    </div>
                  </li>
                  <li>
                    <strong>Special Notes:</strong>
                    <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                      <li>If you&apos;re using port 465, enable the SSL/TLS checkbox</li>
                      <li>If you&apos;re using port 587, enable the SSL/TLS checkbox (TLS will be used automatically)</li>
                      <li>Some Hostinger plans may require you to use an application-specific password instead of your regular email password</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </section>

            {/* Common Errors & How to Fix */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                Common Errors & How to Fix
              </h3>
              <div className="space-y-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Authentication Failed</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> Incorrect username or password.</p>
                  <p className="text-sm text-gray-700"><strong>Solution:</strong> Double-check your SMTP username (usually your full email address) and password. Some providers require application-specific passwords instead of your regular email password.</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Connection Timeout</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> Wrong SMTP host or port, or firewall blocking the connection.</p>
                  <p className="text-sm text-gray-700"><strong>Solution:</strong> Verify your SMTP host address and port number. Ensure your server allows outbound connections on the specified port (587 or 465).</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">SSL/TLS Handshake Failed</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> SSL/TLS settings mismatch with port configuration.</p>
                  <p className="text-sm text-gray-700"><strong>Solution:</strong> Ensure SSL/TLS checkbox is enabled when using port 465 (SSL) or port 587 (TLS). If using port 25, disable SSL/TLS (not recommended for security).</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Emails Blocked by Provider</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> Your email provider is blocking outgoing emails or marking them as spam.</p>
                  <p className="text-sm text-gray-700"><strong>Solution:</strong> Check your domain&apos;s SPF and DKIM records. Ensure your &quot;From Email&quot; address matches your domain. Contact your email provider if issues persist.</p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Port Not Available</h4>
                  <p className="text-sm text-gray-700 mb-2"><strong>Problem:</strong> The specified port is blocked or not supported by your hosting environment.</p>
                  <p className="text-sm text-gray-700"><strong>Solution:</strong> Try switching between port 587 (TLS) and port 465 (SSL). Some hosting providers block certain ports, so you may need to use an alternative port or contact your hosting provider.</p>
                </div>
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                Tips & Best Practices
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <ul className="space-y-3 text-sm sm:text-base text-gray-700 list-disc list-inside">
                  <li>
                    <strong>Use Domain-Based Email:</strong> Always use an email address based on your custom domain (e.g., <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">noreply@yourdomain.com</code>) rather than free email services like Gmail or Yahoo. This improves deliverability and builds trust with recipients.
                  </li>
                  <li>
                    <strong>Configure SPF/DKIM Records:</strong> Set up SPF (Sender Policy Framework) and DKIM (DomainKeys Identified Mail) records in your domain&apos;s DNS settings. These help prevent your emails from being marked as spam and improve deliverability rates.
                  </li>
                  <li>
                    <strong>Avoid Free/Public SMTP Servers:</strong> For production use, avoid free SMTP services that may have sending limits or reliability issues. Use a professional email hosting service like Hostinger, Brevo, SendGrid, or similar providers.
                  </li>
                  <li>
                    <strong>Test Your Configuration:</strong> After setting up SMTP, use the test email feature in the Email Settings to verify your configuration works correctly before going live.
                  </li>
                  <li>
                    <strong>Keep Credentials Secure:</strong> Never share your SMTP credentials publicly or commit them to version control. Treat them like passwords.
                  </li>
                  <li>
                    <strong>Monitor Email Delivery:</strong> Regularly check that customer emails are being sent successfully. Monitor bounce rates and delivery issues through your email provider&apos;s dashboard.
                  </li>
                </ul>
              </div>
            </section>

            {/* Call-to-Action */}
            <section className="mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                Need More Help?
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6 rounded-lg">
                <p className="text-sm sm:text-base text-gray-700 mb-4">
                  If you&apos;re still experiencing issues with SMTP configuration after following this guide, we&apos;re here to help:
                </p>
                <ul className="space-y-2 text-sm sm:text-base text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>Contact Support:</strong> Reach out to our support team through the contact email in the Help dropdown menu.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>Check Provider Documentation:</strong> Refer to your SMTP provider&apos;s official documentation for the most up-to-date settings and troubleshooting steps.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span><strong>Verify DNS Settings:</strong> Ensure your domain&apos;s DNS records (SPF, DKIM, MX) are correctly configured as per your email provider&apos;s requirements.</span>
                  </li>
                </ul>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 md:px-8 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmtpGuidelinesModal;

