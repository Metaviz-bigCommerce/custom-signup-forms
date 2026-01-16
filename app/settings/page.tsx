'use client'

import NavBar from '@/components/NavBar';
import NotificationConfig from '@/components/NotificationConfig';
import CooldownConfig from '@/components/CooldownConfig';
import { Tabs } from '@/components/common/tabs';
import { Bell, Clock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs
          defaultTab={1}
          tabs={[
            { id: 1, label: 'Notifications', icon: Bell, content: <NotificationConfig /> },
            { id: 2, label: 'Cooldown Period', icon: Clock, content: <CooldownConfig /> },
          ]}
        />
      </main>
    </div>
  );
}
