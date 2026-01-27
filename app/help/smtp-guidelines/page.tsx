'use client'

import React, { Suspense } from 'react';
import NavBar from '@/components/NavBar';
import { Mail, Settings, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function SmtpGuidelinesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context') || '';

  const handleBack = () => {
    if (context) {
      router.push(`/dashboard?context=${context}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">SMTP Configuration Guide</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Complete guide to setting up email delivery</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="prose prose-sm sm:prose-base max-w-none">
            
            {/* Main Guide */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600 flex-shrink-0" />
                How to Set Up Email Sending (SMTP)
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-lg">
                <ol className="space-y-4 text-sm sm:text-base text-gray-700 list-decimal list-inside">
                  <li>
                    Go to the platform where you bought your domain (e.g., Hostinger, GoDaddy, etc.).
                  </li>
                  <li>
                    Check if you have a domain-based email (like <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">info@yourdomain.com</code>). If not, create one.
                  </li>
                  <li>
                    Open the email settings and find the SMTP details (host, port, username, password).
                  </li>
                  <li>
                    Paste those details into the SMTP fields in this app&apos;s <strong>Email Settings</strong> tab.
                  </li>
                  <li>
                    Click <strong>Save Settings</strong>. Once saved and valid, your emails will start sending automatically.
                  </li>
                </ol>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function SmtpGuidelinesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </main>
      </div>
    }>
      <SmtpGuidelinesContent />
    </Suspense>
  );
}

