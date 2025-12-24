'use client'

import NavBar from '@/components/NavBar';
import EmailTemplates from '@/components/EmailTemplates';
import EmailConfig from '@/components/EmailConfig';
import { Tabs } from '@/components/common/tabs';
import { Settings, FileText } from 'lucide-react';

export default function EmailsPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8 bg-gray-50">
        <Tabs
          defaultTab={1}
          tabs={[
            { id: 1, label: 'Settings', icon: Settings, content: <EmailConfig /> },
            { id: 2, label: 'Templates', icon: FileText, content: <EmailTemplates /> },
          ]}
        />
      </main>
    </div>
  );
}