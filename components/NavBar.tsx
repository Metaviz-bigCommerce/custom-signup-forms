'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Users, Mail, Wrench, Menu, X, HelpCircle, ChevronDown, Settings } from 'lucide-react';
import { useSession } from '@/context/session';
import { env } from '@/lib/env';
import Tooltip from '@/components/common/Tooltip';

const NavBar: React.FC = () => {
  const pathname = usePathname();
  const { context } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
  const [mobileHelpDropdownOpen, setMobileHelpDropdownOpen] = useState(false);
  const helpDropdownRef = useRef<HTMLDivElement>(null);
  const mobileHelpDropdownRef = useRef<HTMLDivElement>(null);
  const isActive = (href: string) => pathname === href;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target as Node)) {
        setHelpDropdownOpen(false);
      }
      if (mobileHelpDropdownRef.current && !mobileHelpDropdownRef.current.contains(event.target as Node)) {
        setMobileHelpDropdownOpen(false);
      }
    };

    if (helpDropdownOpen || mobileHelpDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [helpDropdownOpen, mobileHelpDropdownOpen]);

  const navItems = [
    { href: `/dashboard?context=${context}`, label: 'Dashboard', icon: Home },
    { href: `/builder?context=${context}`, label: 'Form Builder', icon: Wrench },
    { href: `/requests?context=${context}`, label: 'Requests', icon: Users },
    { href: `/emails?context=${context}`, label: 'Email', icon: Mail },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.4), 0 0 40px rgba(59, 130, 246, 0.2), 0 0 60px rgba(37, 99, 235, 0.1); }
          50% { box-shadow: 0 0 30px rgba(37, 99, 235, 0.6), 0 0 60px rgba(59, 130, 246, 0.3), 0 0 90px rgba(37, 99, 235, 0.15); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes nav-item-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(37, 99, 235, 0.2); }
          50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.4), 0 0 30px rgba(59, 130, 246, 0.2); }
        }
        .logo-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .logo-float {
          animation: float 6s ease-in-out infinite;
        }
        .nav-item-active-glow {
          animation: nav-item-glow 2s ease-in-out infinite;
        }
        .nav-gradient-bg {
          background: #1e40af;
        }
        @media (min-width: 768px) {
          .nav-gradient-bg {
            background: #1e40af;
            background-image: linear-gradient(to bottom, #1e40af 0%, #1e3a8a 100%);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(30, 64, 175, 0.2);
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .mobile-menu-top {
          top: 3.5rem;
        }
        @media (min-width: 640px) {
          .mobile-menu-top {
            top: 4rem;
          }
        }
        .mobile-menu-height {
          max-height: calc(100vh - 3.5rem);
        }
        @media (min-width: 640px) {
          .mobile-menu-height {
            max-height: calc(100vh - 4rem);
          }
        }
        @media (min-width: 1278px) {
          .logo-large-screen img {
            height: 72px !important;
          }
          .logo-large-screen {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }
        }
      `}} />
      <nav 
        className="sticky top-0 z-50 nav-gradient-bg backdrop-blur-sm md:backdrop-blur-none border-b border-white/20 relative"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDAgMiAwYTEgMSAwIDEgMCAtMiAwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18 lg:h-20 min-h-[3.5rem]">
            {/* Left: Logo Section */}
          <Link 
            href={`/dashboard?context=${context}`}
              className="flex items-center group relative flex-shrink-0 min-w-0 transition-all duration-300 group-hover:opacity-90"
          >
              {/* Logo Image */}
              <div className="relative flex-shrink-0 py-1 logo-large-screen">
                <Image
                  src="/Primary Logo 350 x 130.png"
                  alt="Logo"
                  width={350}
                  height={130}
                  className="h-12 w-auto sm:h-14 md:h-16 lg:h-20 xl:h-20 object-contain transition-all duration-300 group-hover:scale-105"
                  priority
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))',
                  }}
                />
              </div>
          </Link>

            {/* Center: Enhanced Navigation Links */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2 rounded-2xl p-1 lg:p-2 backdrop-blur-sm transition-all duration-500 bg-white/10 border border-white/20 shadow-xl overflow-x-auto scrollbar-hide">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href.split('?')[0]);
                return (
            <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 lg:gap-2.5 px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 text-xs lg:text-sm font-semibold rounded-xl transition-all duration-300 group/nav flex-shrink-0 ${
                      active
                        ? 'text-white'
                        : 'text-white hover:text-white'
                    }`}
                  >
                    {/* Active indicator background - vibrant blue gradient */}
                    {active && (
                      <div 
                        className="absolute inset-0 rounded-xl transition-all duration-300"
                        style={{
                          background: 'linear-gradient(to right, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4), 0 0 12px rgba(59, 130, 246, 0.3)',
                        }}
                      />
                    )}
                    
                    {/* Hover effect */}
                    {!active && (
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover/nav:opacity-100 transition-all duration-300 bg-white/10"
                      />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={`relative z-10 w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 transition-all duration-300 flex-shrink-0 ${
                        active 
                          ? 'text-white' 
                          : 'text-white group-hover/nav:text-white group-hover/nav:scale-110 group-hover/nav:rotate-12'
                      }`}
                      style={active ? {
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                      } : {
                        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                      }}
                    />
                    
                    {/* Label */}
                    <span 
                      className={`relative z-10 transition-all duration-300 group-hover/nav:font-bold text-white whitespace-nowrap ${
                        active ? 'font-bold' : ''
                      }`}
                      style={active ? {
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      } : {}}
                    >
                      {item.label}
                    </span>
            </Link>
                );
              })}
          </div>

            {/* Right: Settings & Help Section */}
            <div className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0 relative" ref={helpDropdownRef}>
              <Tooltip content="Settings" position="bottom">
                <Link
                  href={`/settings?context=${context}`}
                  className="group/settings flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg sm:rounded-xl transition-all duration-300 text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 transition-all duration-300 group-hover/settings:scale-110 group-hover/settings:rotate-90 text-white flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                </Link>
              </Tooltip>

              {/* Help Dropdown */}
              <button
                onClick={() => setHelpDropdownOpen(!helpDropdownOpen)}
                className="group/help flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-2.5 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs lg:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                title="Help & Support"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.2)',
                }}
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 transition-all duration-300 group-hover/help:scale-110 group-hover/help:rotate-12 text-white flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                <span className="hidden lg:inline text-white whitespace-nowrap">Help</span>
                <ChevronDown className={`w-3 h-3 text-white transition-transform duration-200 ${helpDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Help Dropdown Menu */}
              {helpDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 sm:w-64 lg:w-72 bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">App Name</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">Custom Signup Forms</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Version</p>
                      <p className="text-xs sm:text-sm text-gray-900">0.1.0</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Contact Email</p>
                      <a 
                        href={`mailto:${env.EMAIL_FROM || 'support@example.com'}`}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline break-all transition-colors duration-200"
                        onClick={() => setHelpDropdownOpen(false)}
                      >
                        {env.EMAIL_FROM || 'support@example.com'}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm hover:shadow-lg flex-shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 transition-transform duration-300 hover:rotate-90 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-300 hover:rotate-90 text-white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
              )}
            </button>
          </div>

        </div>
      </nav>
      
      {/* Enhanced Mobile Menu - Absolute positioned full screen (outside nav for proper z-index) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="md:hidden fixed inset-0 mobile-menu-top bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile menu dropdown */}
          <div 
            className="md:hidden fixed inset-x-0 bottom-0 mobile-menu-top mobile-menu-height z-[70] bg-[#1e40af] border-t border-white/20 backdrop-blur-xl overflow-y-auto"
          >
            <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-2 sm:space-y-3">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href.split('?')[0]);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 ${
                      active
                        ? 'text-white'
                        : 'text-white hover:bg-white/10 hover:text-white'
                    }`}
                    style={active ? {
                      background: 'linear-gradient(to right, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4), 0 0 12px rgba(59, 130, 246, 0.3)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    } : {
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Icon 
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0`} 
                      style={{ filter: active ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))' : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} 
                    />
                    <span className={`text-white ${active ? 'font-bold' : ''}`}>{item.label}</span>
                  </Link>
                );
              })}
              {/* Settings in mobile menu */}
              <Link
                href={`/settings?context=${context}`}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 text-white hover:bg-white/10"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.2)',
                }}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                <span className="text-white">Settings</span>
              </Link>
              {/* Help in mobile menu */}
              <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/20 relative" ref={mobileHelpDropdownRef}>
                <button 
                  onClick={() => setMobileHelpDropdownOpen(!mobileHelpDropdownOpen)}
                  className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200 text-white hover:bg-white/10 w-full text-left"
                  style={{
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }} />
                    <span className="text-white">Help & Support</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-200 flex-shrink-0 ${mobileHelpDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mobile Help Dropdown Menu */}
                {mobileHelpDropdownOpen && (
                  <div className="mt-2 w-full bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="px-4 sm:px-5 py-3.5 sm:py-4 space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm text-white/70 mb-0.5 sm:mb-1" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>App Name</p>
                        <p className="text-sm sm:text-base font-semibold text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Custom Signup Forms</p>
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm text-white/70 mb-0.5 sm:mb-1" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Version</p>
                        <p className="text-sm sm:text-base text-white" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>0.1.0</p>
                      </div>
                      
                      <div>
                        <p className="text-xs sm:text-sm text-white/70 mb-0.5 sm:mb-1" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>Contact Email</p>
                        <a 
                          href={`mailto:${env.EMAIL_FROM || 'support@example.com'}`}
                          className="text-sm sm:text-base text-white hover:text-blue-200 hover:underline break-all transition-colors duration-200"
                          style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                          onClick={() => setMobileHelpDropdownOpen(false)}
                        >
                          {env.EMAIL_FROM || 'support@example.com'}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default NavBar;

