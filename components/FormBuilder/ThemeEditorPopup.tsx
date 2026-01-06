'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Palette, Type, ChevronDown, ChevronUp, Layout, MousePointerClick, Eye, Image, Heading, Sparkles } from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { brandingPresets, defaultTheme } from './utils';

interface ThemeEditorPopupProps {
  isOpen: boolean;
  theme: any;
  onSave: (theme: any) => void;
  onClose: () => void;
}

const ThemeEditorPopup: React.FC<ThemeEditorPopupProps> = ({ isOpen, theme, onSave, onClose }) => {
  const [localTheme, setLocalTheme] = useState<any>(null);
  const initialThemeRef = useRef<any>(null);
  const [openSection, setOpenSection] = useState<'content' | 'layout' | 'button' | 'typography' | 'branding' | null>('branding');

  useEffect(() => {
    if (isOpen) {
      const themeCopy = { ...theme };
      setLocalTheme(themeCopy);
      initialThemeRef.current = themeCopy;
      setOpenSection('branding');
    } else {
      setLocalTheme(null);
      initialThemeRef.current = null;
      setOpenSection(null);
    }
  }, [isOpen, theme]);

  const hasChanges = useMemo(() => {
    if (!localTheme || !initialThemeRef.current) return false;
    return JSON.stringify(localTheme) !== JSON.stringify(initialThemeRef.current);
  }, [localTheme]);

  if (!localTheme || !isOpen) return null;

  const handleThemeChange = (updates: any) => {
    // If primaryColor is being updated, automatically sync buttonBg, titleColor, and subtitleColor to match it
    // This keeps primary color, button background, title color, and subtitle color in sync by default
    // User can still customize these separately if needed
    if (updates.primaryColor !== undefined) {
      const currentButtonBg = localTheme.buttonBg;
      const currentPrimaryColor = localTheme.primaryColor;
      const currentTitleColor = localTheme.titleColor;
      const currentSubtitleColor = localTheme.subtitleColor;
      // Auto-sync if buttonBg is not set, or if it matches the current primaryColor (not explicitly customized)
      if (!currentButtonBg || currentButtonBg === currentPrimaryColor) {
        updates.buttonBg = updates.primaryColor;
      }
      // Auto-sync titleColor if it's not explicitly set or matches the current primaryColor
      if (!currentTitleColor || currentTitleColor === currentPrimaryColor || currentTitleColor === defaultTheme.titleColor) {
        updates.titleColor = updates.primaryColor;
      }
      // Auto-sync subtitleColor if it's not explicitly set or matches the default subtitle color
      // Use a lighter/darker shade of primary color for subtitle (or same color if user prefers)
      if (!currentSubtitleColor || currentSubtitleColor === defaultTheme.subtitleColor) {
        // Use primary color for subtitle as well (user can customize separately if needed)
        updates.subtitleColor = updates.primaryColor;
      }
    }
    const updatedTheme = { ...localTheme, ...updates };
    setLocalTheme(updatedTheme);
  };

  const handleSave = () => {
    if (!localTheme) return;
    onSave(localTheme);
    onClose();
  };

  const handleClose = () => {
    if (initialThemeRef.current) {
      setLocalTheme({ ...initialThemeRef.current });
    }
    onClose();
  };

  const toggleSection = (section: 'content' | 'layout' | 'button' | 'typography' | 'branding') => {
    setOpenSection((prev) => {
      if (prev === section) {
        return null;
      }
      return section;
    });
  };

  const handleBrandingPreset = (preset: { name: string; primaryColor: string; pageBackgroundColor: string }) => {
    handleThemeChange({
      primaryColor: preset.primaryColor,
      pageBackgroundColor: preset.pageBackgroundColor,
      titleColor: preset.primaryColor, // Also update title color to match
      subtitleColor: preset.primaryColor, // Also update subtitle color to match
      buttonBg: preset.primaryColor // Sync button background
    });
  };

  const hasValidImageUrl = localTheme.layout === 'split' && localTheme.splitImageUrl && localTheme.splitImageUrl.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header - Enhanced with light gradient - Fully responsive */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
              <Palette className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">Edit Theme Settings</h3>
              <p className="text-[10px] sm:text-xs text-slate-600 font-medium truncate">Customize your form appearance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-all duration-200 hover:scale-110 cursor-pointer flex-shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Panel - Settings - Fully responsive */}
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 border-r-0 lg:border-r border-slate-200">
              {/* Branding Presets */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('branding')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-purple-50 hover:to-pink-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Branding Presets</span>
                  </div>
                  {openSection === 'branding' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'branding' && (
                  <div key="branding-section" className="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs text-slate-600 mb-2">Quickly apply professional color schemes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {brandingPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleBrandingPreset(preset)}
                          className="group relative p-3 rounded-lg border-2 border-slate-200 hover:border-purple-400 transition-all duration-200 hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <span className="text-xs font-medium text-slate-700">{preset.name}</span>
                          </div>
                          <div
                            className="w-full h-2 rounded"
                            style={{ backgroundColor: preset.pageBackgroundColor }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Settings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('content')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-purple-50 hover:to-pink-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Content</span>
                  </div>
                  {openSection === 'content' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'content' && (
                  <div key="content-section" className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                      <input
                        type="text"
                        value={localTheme.title}
                        onChange={(e) => handleThemeChange({ title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
                      <input
                        type="text"
                        value={localTheme.subtitle}
                        onChange={(e) => handleThemeChange({ subtitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <ColorPicker
                      label="Primary Color"
                      value={localTheme.primaryColor}
                      onChange={(value) => handleThemeChange({ primaryColor: value })}
                    />
                    <ColorPicker
                      label="Form Background Color"
                      value={localTheme.formBackgroundColor || '#ffffff'}
                      onChange={(value) => handleThemeChange({ formBackgroundColor: value })}
                    />
                  </div>
                )}
              </div>

              {/* Typography Settings - Title & Subtitle */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('typography')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-purple-50 hover:to-pink-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Heading className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Typography</span>
                  </div>
                  {openSection === 'typography' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'typography' && (
                  <div key="typography-section" className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    {/* Title Styling */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Title Styling</h4>
                      <ColorPicker
                        label="Title Color"
                        value={localTheme.titleColor || localTheme.primaryColor || defaultTheme.titleColor}
                        onChange={(value) => handleThemeChange({ titleColor: value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size (px)</label>
                          <input
                            type="number"
                            value={localTheme.titleFontSize ?? defaultTheme.titleFontSize}
                            onChange={(e) => handleThemeChange({ titleFontSize: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Weight</label>
                          <select
                            value={localTheme.titleFontWeight || defaultTheme.titleFontWeight}
                            onChange={(e) => handleThemeChange({ titleFontWeight: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="300">Light (300)</option>
                            <option value="400">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="700">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                            <option value="900">Black (900)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Subtitle Styling */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">Subtitle Styling</h4>
                      <ColorPicker
                        label="Subtitle Color"
                        value={localTheme.subtitleColor || localTheme.primaryColor || defaultTheme.subtitleColor}
                        onChange={(value) => handleThemeChange({ subtitleColor: value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size (px)</label>
                          <input
                            type="number"
                            value={localTheme.subtitleFontSize ?? defaultTheme.subtitleFontSize}
                            onChange={(e) => handleThemeChange({ subtitleFontSize: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Weight</label>
                          <select
                            value={localTheme.subtitleFontWeight || defaultTheme.subtitleFontWeight}
                            onChange={(e) => handleThemeChange({ subtitleFontWeight: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="300">Light (300)</option>
                            <option value="400">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="700">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layout Settings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('layout')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-purple-50 hover:to-pink-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Layout</span>
                  </div>
                  {openSection === 'layout' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'layout' && (
                  <div key="layout-section" className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Layout Type</label>
                      <select
                        value={localTheme.layout}
                        onChange={(e) => handleThemeChange({ layout: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="center">Center</option>
                        <option value="split">Split</option>
                      </select>
                    </div>
                    {localTheme.layout === 'split' && (
                      <div className="animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Split Image URL
                          {!hasValidImageUrl && (
                            <span className="ml-2 text-xs text-amber-600 font-normal">(Will use center layout if empty)</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://example.com/hero.jpg"
                            value={localTheme.splitImageUrl}
                            onChange={(e) => handleThemeChange({ splitImageUrl: e.target.value })}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          {localTheme.splitImageUrl && (
                            <div className="relative group">
                              <Image className="w-10 h-10 p-2 text-gray-400 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50" />
                              <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-white rounded-md shadow-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <img src={localTheme.splitImageUrl} alt="Preview" className="w-full h-32 object-cover rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Background Color</label>
                      <ColorPicker
                        label=""
                        value={localTheme.pageBackgroundColor || defaultTheme.pageBackgroundColor}
                        onChange={(value) => handleThemeChange({ pageBackgroundColor: value })}
                      />
                      <p className="text-xs text-slate-500 mt-1">Background color for the entire signup page (not the form card)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Button Settings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('button')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-purple-50 hover:to-pink-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Submit Button</span>
                  </div>
                  {openSection === 'button' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'button' && (
                  <div key="button-section" className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                      <input
                        type="text"
                        value={localTheme.buttonText}
                        onChange={(e) => handleThemeChange({ buttonText: e.target.value })}
                        className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Background"
                        value={localTheme.buttonBg}
                        onChange={(value) => handleThemeChange({ buttonBg: value })}
                      />
                      <ColorPicker
                        label="Text Color"
                        value={localTheme.buttonColor}
                        onChange={(value) => handleThemeChange({ buttonColor: value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
                      <input
                        type="number"
                        value={localTheme.buttonRadius}
                        onChange={(e) => handleThemeChange({ buttonRadius: Number(e.target.value) })}
                        className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="p-6 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
              <div className="sticky top-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Live Preview</h4>
                    <p className="text-xs text-slate-500">Real-time updates</p>
                  </div>
                </div>
                <div 
                  className="rounded-xl shadow-xl p-4 border border-slate-200"
                  style={{ backgroundColor: localTheme.pageBackgroundColor || defaultTheme.pageBackgroundColor }}
                >
                  <div
                    className="rounded-lg p-6 border border-slate-200"
                    style={{ backgroundColor: localTheme.formBackgroundColor || '#ffffff' }}
                  >
                    <div className="space-y-4">
                    <div>
                      <h2 
                        className="mb-2"
                        style={{ 
                          color: localTheme.titleColor || localTheme.primaryColor || defaultTheme.titleColor,
                          fontSize: (localTheme.titleFontSize ?? defaultTheme.titleFontSize) + 'px',
                          fontWeight: localTheme.titleFontWeight || defaultTheme.titleFontWeight
                        }}
                      >
                        {localTheme.title || 'Create your account'}
                      </h2>
                      <p 
                        className="mb-6"
                        style={{
                          color: localTheme.subtitleColor || localTheme.primaryColor || defaultTheme.subtitleColor,
                          fontSize: (localTheme.subtitleFontSize ?? defaultTheme.subtitleFontSize) + 'px',
                          fontWeight: localTheme.subtitleFontWeight || defaultTheme.subtitleFontWeight
                        }}
                      >
                        {localTheme.subtitle || 'Please fill in the form to continue'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Sample Field</label>
                        <input
                          type="text"
                          placeholder="Enter text here"
                          style={{ backgroundColor: '#ffffff' }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: localTheme.buttonBg || localTheme.primaryColor || '#2563eb',
                        color: localTheme.buttonColor || '#ffffff',
                        borderRadius: (localTheme.buttonRadius ?? 10) + 'px',
                        marginTop: '16px',
                        width: '100%',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {localTheme.buttonText || 'Create account'}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fully responsive */}
        <div className="sticky bottom-0 bg-gradient-to-r from-white to-slate-50 border-t border-slate-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-600 font-medium">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span className="truncate">You have unsaved changes</span>
            </div>
          )}
          <div className="flex gap-2 sm:gap-3 ml-auto w-full sm:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 cursor-pointer touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold text-white transition-all duration-200 touch-manipulation ${
                hasChanges 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-105 cursor-pointer' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditorPopup;

