'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Users, Mail, Sparkles, Bell, ChevronDown, Wrench } from 'lucide-react';
import { useSession } from '@/context/session';

const NavBar: React.FC = () => {
  const pathname = usePathname();
  const { context } = useSession();
  const isActive = (href: string) => pathname === href;

  return (
    <nav 
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16162a 50%, #1a1a2e 100%)',
        borderColor: 'rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo Section */}
          <Link 
            href={`/dashboard?context=${context}`}
            className="flex items-center gap-3 group"
          >
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span 
                className="text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                SignupPro
              </span>
              <span className="text-xs font-medium" style={{ color: '#a0a0b8' }}>Professional Edition</span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1">
            <Link
              href={`/dashboard?context=${context}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/dashboard')
                  ? ''
                  : ''
              }`}
              style={isActive('/dashboard') ? {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.25) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              } : {
                color: '#a0a0b8',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/dashboard')) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/dashboard')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a0a0b8';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href={`/builder?context=${context}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/builder')
                  ? ''
                  : ''
              }`}
              style={isActive('/builder') ? {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.25) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              } : {
                color: '#a0a0b8',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/builder')) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/builder')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a0a0b8';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <Wrench className="w-4 h-4" />
              Form Builder
            </Link>
            <Link
              href={`/requests?context=${context}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/requests')
                  ? ''
                  : ''
              }`}
              style={isActive('/requests') ? {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.25) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              } : {
                color: '#a0a0b8',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/requests')) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/requests')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a0a0b8';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <Users className="w-4 h-4" />
              Requests
            </Link>
            <Link
              href={`/emails?context=${context}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/emails')
                  ? ''
                  : ''
              }`}
              style={isActive('/emails') ? {
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(109, 40, 217, 0.25) 100%)',
                color: '#ffffff',
                border: '1px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)'
              } : {
                color: '#a0a0b8',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive('/emails')) {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive('/emails')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a0a0b8';
                  e.currentTarget.style.border = '1px solid transparent';
                }
              }}
            >
              <Mail className="w-4 h-4" />
              Email
            </Link>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button 
              className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 group"
              style={{
                background: 'rgba(30, 30, 45, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 30, 45, 0.4)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Bell className="w-4 h-4 text-white" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2" style={{ backgroundColor: '#ef4444', borderColor: '#1a1a2e' }} />
            </button>

            {/* Settings */}
            <button 
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 group"
              style={{
                background: 'rgba(30, 30, 45, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 30, 45, 0.4)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Settings className="w-4 h-4 text-white" />
            </button>

            {/* User Profile Dropdown */}
            <button 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 group"
              style={{
                background: 'rgba(30, 30, 45, 0.4)',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 30, 45, 0.4)';
                e.currentTarget.style.border = '1px solid rgba(139, 92, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div 
                className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)'
                }}
              >
                JD
              </div>
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

