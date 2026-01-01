'use client'

import NavBar from '@/components/NavBar';
import EmailTemplates from '@/components/EmailTemplates';
import EmailConfig from '@/components/EmailConfig';
import { Tabs } from '@/components/common/tabs';
import { Settings, FileText } from 'lucide-react';

export default function EmailsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs
          defaultTab={1}
          tabs={[
            { id: 1, label: 'Templates', icon: FileText, content: <EmailTemplates /> },
            { id: 2, label: 'Settings', icon: Settings, content: <EmailConfig /> },
          ]}
        />
      </main>
    </div>
  );
}