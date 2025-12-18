'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Settings, Type, ChevronDown, ChevronUp, MousePointerClick, Eye } from 'lucide-react';
import { FormField } from './types';
import { ColorPicker } from './ColorPicker';

interface FieldEditorPopupProps {
  isOpen: boolean;
  selectedField: FormField | null;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

const FieldEditorPopup: React.FC<FieldEditorPopupProps> = ({ isOpen, selectedField, onSave, onClose }) => {
  const [localField, setLocalField] = useState<FormField | null>(null);
  const fieldIdRef = useRef<number | null>(null);
  const initialFieldRef = useRef<FormField | null>(null);
  const [openSection, setOpenSection] = useState<'basic' | 'labelStyle' | 'inputStyle' | null>('basic');

  useEffect(() => {
    if (selectedField && isOpen) {
      if (fieldIdRef.current !== selectedField.id || !localField) {
        const fieldCopy = { ...selectedField };
        setLocalField(fieldCopy);
        initialFieldRef.current = fieldCopy;
        fieldIdRef.current = selectedField.id;
        setOpenSection('basic');
      }
    } else {
      setLocalField(null);
      initialFieldRef.current = null;
      fieldIdRef.current = null;
      setOpenSection(null);
    }
  }, [selectedField?.id, isOpen]);

  const hasChanges = useMemo(() => {
    if (!localField || !initialFieldRef.current) return false;
    return JSON.stringify(localField) !== JSON.stringify(initialFieldRef.current);
  }, [localField]);

  if (!localField || !isOpen) return null;

  const handleChange = (updates: Partial<FormField>) => {
    if (!localField) return;
    const updatedField = { ...localField, ...updates };
    setLocalField(updatedField);
  };

  const handleSave = () => {
    if (!localField || !fieldIdRef.current) return;
    onSave(localField);
    onClose();
  };

  const handleClose = () => {
    if (initialFieldRef.current) {
      setLocalField({ ...initialFieldRef.current });
    }
    onClose();
  };

  const toggleSection = (section: 'basic' | 'labelStyle' | 'inputStyle') => {
    setOpenSection((prev) => {
      if (prev === section) {
        return null;
      }
      return section;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Edit Field</h3>
              <p className="text-xs text-gray-500 capitalize">{localField.type} field</p>
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
              {/* Basic Settings */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Basic Settings</span>
                  </div>
                  {openSection === 'basic' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {openSection === 'basic' && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Label</label>
                      <input
                        type="text"
                        value={localField.label}
                        onChange={(e) => handleChange({ label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Placeholder</label>
                      <input
                        type="text"
                        value={localField.placeholder}
                        onChange={(e) => handleChange({ placeholder: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-slate-200">
                      <input
                        type="checkbox"
                        checked={localField.required}
                        onChange={(e) => !localField.locked && handleChange({ required: e.target.checked })}
                        className={`w-4 h-4 rounded focus:ring-2 ${localField.locked ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 cursor-pointer'}`}
                        id="required-checkbox"
                        disabled={!!localField.locked}
                      />
                      <label htmlFor="required-checkbox" className={`text-sm font-medium ${localField.locked ? 'text-gray-400' : 'text-gray-700'} ${localField.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        Required field {localField.locked ? '(always on)' : ''}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Label Styling */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('labelStyle')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Label Styling</span>
                  </div>
                  {openSection === 'labelStyle' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {openSection === 'labelStyle' && (
                  <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <ColorPicker
                      label="Color"
                      value={localField.labelColor}
                      onChange={(value) => handleChange({ labelColor: value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Size (px)</label>
                        <input
                          type="number"
                          value={localField.labelSize}
                          onChange={(e) => handleChange({ labelSize: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Weight</label>
                        <select
                          value={localField.labelWeight}
                          onChange={(e) => handleChange({ labelWeight: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="400">Normal</option>
                          <option value="500">Medium</option>
                          <option value="600">Semi-bold</option>
                          <option value="700">Bold</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Styling */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('inputStyle')}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Input Styling</span>
                  </div>
                  {openSection === 'inputStyle' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {openSection === 'inputStyle' && (
                  <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Border Color"
                        value={localField.borderColor}
                        onChange={(value) => handleChange({ borderColor: value })}
                      />
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Border Width (px)</label>
                        <input
                          type="number"
                          value={localField.borderWidth}
                          onChange={(e) => handleChange({ borderWidth: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Border Radius (px)</label>
                        <input
                          type="number"
                          value={localField.borderRadius}
                          onChange={(e) => handleChange({ borderRadius: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs font-medium text-gray-500 mb-2">Padding (px)</label>
                        <input
                          type="number"
                          value={localField.padding}
                          onChange={(e) => handleChange({ padding: e.target.value })}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="Background"
                        value={localField.bgColor}
                        onChange={(value) => handleChange({ bgColor: value })}
                      />
                      <ColorPicker
                        label="Text Color"
                        value={localField.textColor}
                        onChange={(value) => handleChange({ textColor: value })}
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-500 mb-2">Font Size (px)</label>
                      <input
                        type="number"
                        value={localField.fontSize}
                        onChange={(e) => handleChange({ fontSize: e.target.value })}
                        className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
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
                <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
                  <div className="space-y-3">
                    <label 
                      style={{ 
                        color: localField.labelColor, 
                        fontSize: localField.labelSize + 'px', 
                        fontWeight: localField.labelWeight 
                      }}
                      className="block"
                    >
                      {localField.label || 'Field Label'} {localField.required && <span className="text-red-500">*</span>}
                    </label>
                    {localField.type === 'textarea' ? (
                      <textarea
                        placeholder={localField.placeholder}
                        style={{
                          borderColor: localField.borderColor,
                          borderWidth: localField.borderWidth + 'px',
                          borderRadius: localField.borderRadius + 'px',
                          backgroundColor: localField.bgColor,
                          padding: localField.padding + 'px',
                          fontSize: localField.fontSize + 'px',
                          color: localField.textColor
                        }}
                        className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={localField.type === 'phone' ? 'tel' : localField.type}
                        placeholder={localField.placeholder}
                        style={{
                          borderColor: localField.borderColor,
                          borderWidth: localField.borderWidth + 'px',
                          borderRadius: localField.borderRadius + 'px',
                          backgroundColor: localField.bgColor,
                          padding: localField.padding + 'px',
                          fontSize: localField.fontSize + 'px',
                          color: localField.textColor
                        }}
                        className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    )}
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

export default FieldEditorPopup;

