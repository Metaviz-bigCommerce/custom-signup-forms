'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Mail, Sparkles, Wrench, Menu, X, HelpCircle, BookOpen } from 'lucide-react';
import { useSession } from '@/context/session';

const NavBar: React.FC = () => {
  const pathname = usePathname();
  const { context } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isActive = (href: string) => pathname === href;

  // Track scroll for header effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          0%, 100% { box-shadow: 0 0 15px rgba(37, 99, 235, 0.25), 0 0 30px rgba(37, 99, 235, 0.08); }
          50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.35), 0 0 40px rgba(37, 99, 235, 0.12); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .nav-gradient-bg {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%);
          background-size: 200% 200%;
          animation: shimmer 10s ease-in-out infinite;
        }
        .logo-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .logo-float {
          animation: float 8s ease-in-out infinite;
        }
      `}} />
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200/60' 
            : 'nav-gradient-bg backdrop-blur-md border-b border-slate-200/40'
        }`}
      >
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-indigo-50/20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left: Enhanced Logo Section */}
          <Link 
            href={`/dashboard?context=${context}`}
              className="flex items-center gap-3 group relative"
          >
              {/* Animated logo container */}
              <div className="relative">
            <div 
                  className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 logo-float logo-glow"
              style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 30%, #3b82f6 60%, #1e40af 100%)',
                  }}
                >
                  {/* Inner glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Icon with subtle rotation */}
                  <Sparkles className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-90" />
                  
                  {/* Subtle animated particles */}
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.2s' }} />
                </div>
                
                {/* Subtle ripple effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-blue-500/15 scale-0 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10" />
            </div>
              
              {/* Enhanced text with gradient */}
            <div className="flex flex-col">
                <div className="relative">
              <span 
                    className="text-xl font-extrabold tracking-tight relative z-10 transition-all duration-200 group-hover:scale-[1.02]"
                style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%)',
                      backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'shimmer 4s ease-in-out infinite',
                }}
              >
                    Signup Flow
              </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1 w-1 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">BigCommerce</span>
                  <div className="h-1 w-1 rounded-full bg-indigo-500" />
                </div>
            </div>
          </Link>

            {/* Center: Enhanced Navigation Links */}
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-slate-50/90 via-white/90 to-slate-50/90 rounded-2xl p-2 border border-slate-200/60 shadow-md backdrop-blur-sm">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href.split('?')[0]);
                return (
            <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 group/nav ${
                      active
                        ? 'text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {/* Active indicator background - simplified */}
                    {active && (
                      <div 
                        className="absolute inset-0 rounded-xl transition-all duration-200"
                        style={{
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                        }}
                      />
                    )}
                    
                    {/* Hover effect */}
                    {!active && (
                      <div 
                        className="absolute inset-0 rounded-xl opacity-0 group-hover/nav:opacity-100 transition-all duration-200"
                        style={{
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)',
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <Icon 
                      className={`relative z-10 w-4.5 h-4.5 transition-all duration-200 ${
                        active 
                          ? 'text-blue-600' 
                          : 'text-slate-500 group-hover/nav:text-blue-600 group-hover/nav:scale-105'
                      }`}
                    />
                    
                    {/* Label */}
                    <span className="relative z-10 transition-all duration-200">{item.label}</span>
            </Link>
                );
              })}
          </div>

            {/* Right: Help/Documentation Section */}
            <div className="hidden lg:flex items-center gap-2">
              <a
                href="#"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                title="Documentation"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden xl:inline">Docs</span>
              </a>
            <button 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors duration-200"
                title="Help & Support"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden xl:inline">Help</span>
            </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href.split('?')[0]);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </nav>
    </>
  );
};

export default NavBar;

