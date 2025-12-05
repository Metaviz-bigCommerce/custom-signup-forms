'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Users, Mail } from 'lucide-react';
import { useSession } from '@/context/session';

const NavBar: React.FC = () => {
  const pathname = usePathname();
  const { context } = useSession();
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded"></div>
              <span className="text-xl font-bold text-gray-900">SignupPro</span>
            </div>
            <div className="flex gap-1">
              <Link
                href={`/dashboard?context=${context}`}
                className={`flex items-center gap-2 px-3 py-2 font-medium rounded-md transition-colors border ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href={`/builder?context=${context}`}
                className={`flex items-center gap-2 px-3 py-2 font-medium rounded-md transition-colors border ${
                  isActive('/builder')
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Settings className="w-4 h-4" />
                Form Builder
              </Link>
              <Link
                href={`/requests?context=${context}`}
                className={`flex items-center gap-2 px-3 py-2 font-medium rounded-md transition-colors border ${
                  isActive('/requests')
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                Requests
              </Link>
              <Link
                href={`/emails?context=${context}`}
                className={`flex items-center gap-2 px-3 py-2 font-medium rounded-md transition-colors border ${
                  isActive('/emails')
                    ? 'bg-blue-50 text-blue-700 border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Settings
            </button>
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

