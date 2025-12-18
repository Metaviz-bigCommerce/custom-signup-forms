'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Palette, Type, ChevronDown, ChevronUp, Layout, MousePointerClick, Eye, Image } from 'lucide-react';
import { ColorPicker } from './ColorPicker';

interface ThemeEditorPopupProps {
  isOpen: boolean;
  theme: any;
  onSave: (theme: any) => void;
  onClose: () => void;
}

const ThemeEditorPopup: React.FC<ThemeEditorPopupProps> = ({ isOpen, theme, onSave, onClose }) => {
  const [localTheme, setLocalTheme] = useState<any>(null);
  const initialThemeRef = useRef<any>(null);
  const [openSection, setOpenSection] = useState<'content' | 'layout' | 'button' | null>('content');

  useEffect(() => {
    if (isOpen) {
      const themeCopy = { ...theme };
      setLocalTheme(themeCopy);
      initialThemeRef.current = themeCopy;
      setOpenSection('content');
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

  const toggleSection = (section: 'content' | 'layout' | 'button') => {
    setOpenSection((prev) => {
      if (prev === section) {
        return null;
      }
      return section;
    });
  };

  const hasValidImageUrl = localTheme.layout === 'split' && localTheme.splitImageUrl && localTheme.splitImageUrl.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Edit Theme Settings</h3>
              <p className="text-xs text-gray-500">Customize your form appearance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Panel - Settings */}
            <div className="p-6 space-y-4 border-r border-slate-200">
              {/* Content Settings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('content')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Content</span>
                  </div>
                  {openSection === 'content' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
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

              {/* Layout Settings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('layout')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Layout</span>
                  </div>
                  {openSection === 'layout' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
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
                  </div>
                )}
              </div>

              {/* Button Settings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('button')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Submit Button</span>
                  </div>
                  {openSection === 'button' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
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
            <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100">
              <div className="sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Live Preview</h4>
                </div>
                <div 
                  className="rounded-lg shadow-lg p-6 border border-slate-200"
                  style={{ backgroundColor: localTheme.formBackgroundColor || '#ffffff' }}
                >
                  <div className="space-y-4">
                    <div>
                      <h2 
                        className="text-2xl font-bold mb-2"
                        style={{ color: localTheme.primaryColor }}
                      >
                        {localTheme.title || 'Create your account'}
                      </h2>
                      <p className="text-gray-600 text-sm mb-6">
                        {localTheme.subtitle || 'Please fill in the form to continue'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Sample Field</label>
                        <input
                          type="text"
                          placeholder="Enter text here"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        backgroundColor: localTheme.buttonBg,
                        color: localTheme.buttonColor,
                        borderRadius: localTheme.buttonRadius + 'px',
                        marginTop: '16px',
                        width: '100%',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      className="hover:opacity-90 transition-opacity"
                    >
                      {localTheme.buttonText || 'Create account'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>You have unsaved changes</span>
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-all ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : 'bg-gray-300 cursor-not-allowed'
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

