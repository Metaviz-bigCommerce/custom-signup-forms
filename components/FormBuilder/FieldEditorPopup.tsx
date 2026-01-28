'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Settings, Type, ChevronDown, ChevronUp, MousePointerClick, Eye, Plus, Trash2 } from 'lucide-react';
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
  }, [selectedField?.id, isOpen, selectedField, localField]);

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
    
    // Validate radio field has at least 2 options
    if (localField.type === 'radio' && (!localField.options || localField.options.length < 2)) {
      alert('Radio fields must have at least 2 options');
      return;
    }
    
    // Validate checkbox: if no label, at least one option is required
    if (localField.type === 'checkbox' && !localField.label?.trim() && (!localField.options || localField.options.length === 0)) {
      alert('Checkbox fields without a label must have at least one option');
      return;
    }
    
    onSave(localField);
    onClose();
  };

  const addOption = () => {
    if (!localField) return;
    const currentOptions = localField.options || [];
    const newOption = { label: `Option ${currentOptions.length + 1}`, value: `option${currentOptions.length + 1}` };
    handleChange({ options: [...currentOptions, newOption] });
  };

  const removeOption = (index: number) => {
    if (!localField || !localField.options) return;
    // For radio, ensure at least 2 options remain
    if (localField.type === 'radio' && localField.options.length <= 2) {
      alert('Radio fields must have at least 2 options');
      return;
    }
    const newOptions = localField.options.filter((_, i) => i !== index);
    handleChange({ options: newOptions });
  };

  const updateOption = (index: number, updates: Partial<{ label: string; value: string }>) => {
    if (!localField || !localField.options) return;
    const newOptions = localField.options.map((opt, i) => 
      i === index ? { ...opt, ...updates } : opt
    );
    handleChange({ options: newOptions });
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
    <>
      <style>{`
        .radio-custom-preview {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          background-color: white;
          position: relative;
        }
        
        .radio-custom-preview:checked {
          border-color: #000000;
          background-color: #000000;
        }
        
        .radio-custom-preview:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: white;
        }
        
        .checkbox-custom-preview {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          position: relative;
        }
        
        .checkbox-custom-preview:checked {
          border-color: #000000;
          background-color: #000000;
        }
        
        .checkbox-custom-preview:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
          line-height: 1;
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-3 md:p-4" onClick={handleClose}>
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        {/* Header - Enhanced with light gradient - Fully responsive */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">Edit Field</h3>
              <p className="text-[10px] sm:text-xs text-slate-600 capitalize font-medium truncate">{localField.type} field</p>
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
              {/* Basic Settings */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('basic')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-indigo-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Basic Settings</span>
                  </div>
                  {openSection === 'basic' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'basic' && (
                  <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Label
                        {localField.type === 'checkbox' && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                      </label>
                      <input
                        type="text"
                        value={localField.label}
                        onChange={(e) => handleChange({ label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={localField.type === 'checkbox' ? 'Leave empty for option-only checkboxes' : ''}
                        maxLength={localField.type === 'checkbox' ? 250 : 50}
                      />
                    </div>
                    {/* Hide placeholder for radio and checkbox fields */}
                    {localField.type !== 'radio' && localField.type !== 'checkbox' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Placeholder</label>
                        <input
                          type="text"
                          value={localField.placeholder}
                          onChange={(e) => handleChange({ placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          maxLength={50}
                        />
                      </div>
                    )}
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
                    
                    {/* Options management for select, radio, and checkbox */}
                    {(localField.type === 'select' || localField.type === 'radio' || localField.type === 'checkbox') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700">
                            {localField.type === 'radio' ? 'Radio Options' : localField.type === 'checkbox' ? 'Checkbox Options' : 'Select Options'}
                            {localField.type === 'radio' && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <button
                            type="button"
                            onClick={addOption}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Option
                          </button>
                        </div>
                        {localField.type === 'radio' && (
                          <p className="text-xs text-gray-500">Radio fields require at least 2 options</p>
                        )}
                        {localField.type === 'checkbox' && (
                          <p className="text-xs text-gray-500">
                            {localField.label ? (
                              'Add options to create a checkbox group, or leave empty for a single checkbox'
                            ) : (
                              'At least one option is required when no label is provided'
                            )}
                          </p>
                        )}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(localField.options || []).map((option, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-slate-200">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => updateOption(index, { label: e.target.value })}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Option label"
                                    maxLength={localField.type === 'checkbox' ? 250 : 200}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                                  <input
                                    type="text"
                                    value={option.value}
                                    onChange={(e) => updateOption(index, { value: e.target.value })}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="option_value"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="cursor-pointer p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  (localField.type === 'radio' && (localField.options?.length || 0) <= 2) ||
                                  (localField.type === 'checkbox' && !localField.label?.trim() && (localField.options?.length || 0) <= 1)
                                }
                                title="Remove option"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {(!localField.options || localField.options.length === 0) && (
                            <p className="text-xs text-gray-400 text-center py-2">No options added yet</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Label Styling */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('labelStyle')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-indigo-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Label Styling</span>
                  </div>
                  {openSection === 'labelStyle' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleChange({ labelSize: '' });
                              return;
                            }
                            const num = parseInt(value);
                            if (!isNaN(num)) {
                              const clamped = Math.max(10, Math.min(24, num));
                              handleChange({ labelSize: String(clamped) });
                            }
                          }}
                          className="w-full px-3 py-2 h-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          min={10}
                          max={24}
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
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection('inputStyle')}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-slate-50 to-white hover:from-blue-50 hover:to-indigo-50 flex items-center justify-between transition-all duration-200 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">Input Styling</span>
                  </div>
                  {openSection === 'inputStyle' ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />}
                </button>
                {openSection === 'inputStyle' && (
                  <div className="p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

            {/* Right Panel - Live Preview - Fully responsive */}
            <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 border-t lg:border-t-0 lg:border-l border-slate-200">
              <div className="sticky top-3 sm:top-4 md:top-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 truncate">Live Preview</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">Real-time updates</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-6 border border-slate-200">
                  <div className="space-y-3">
                    <label 
                      style={{ 
                        color: localField.labelColor, 
                        fontSize: localField.labelSize + 'px', 
                        fontWeight: localField.labelWeight,
                        wordWrap: 'break-word',
                        overflowWrap: 'anywhere',
                        maxWidth: '100%'
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
                    ) : localField.type === 'select' ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <select
                          style={{
                            borderColor: localField.borderColor,
                            borderWidth: localField.borderWidth + 'px',
                            borderRadius: localField.borderRadius + 'px',
                            backgroundColor: localField.bgColor,
                            padding: localField.padding + 'px',
                            paddingRight: (parseInt(localField.padding) || 10) + 30 + 'px', // Extra padding for dropdown arrow
                            fontSize: localField.fontSize + 'px',
                            color: localField.textColor,
                            width: '100%',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none'
                          }}
                          className="w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="">{localField.placeholder || 'Select an option'}</option>
                          {(localField.options || []).map((opt, idx) => (
                            <option key={idx} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <svg
                          style={{
                            position: 'absolute',
                            right: (parseInt(localField.padding) || 10) + 8 + 'px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            width: '16px',
                            height: '16px'
                          }}
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="#6b7280"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : localField.type === 'radio' ? (
                      <div className="space-y-2">
                        {(localField.options || []).map((opt, idx) => (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`preview-radio-${localField.id}`}
                              value={opt.value}
                              style={{
                                width: '18px',
                                height: '18px'
                              }}
                              className="radio-custom-preview"
                            />
                            <span style={{ 
                              fontSize: localField.fontSize + 'px', 
                              color: localField.textColor,
                              wordWrap: 'break-word',
                              overflowWrap: 'anywhere',
                              flex: '1',
                              minWidth: 0
                            }}>
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : localField.type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(localField.options && localField.options.length > 0) ? (
                          // Checkbox group
                          (localField.options || []).map((opt, idx) => (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={opt.value}
                                style={{
                                  width: '18px',
                                  height: '18px'
                                }}
                                className="checkbox-custom-preview"
                              />
                              <span style={{ 
                                fontSize: localField.fontSize + 'px', 
                                color: localField.textColor,
                                wordWrap: 'break-word',
                                overflowWrap: 'anywhere',
                                flex: '1',
                                minWidth: 0
                              }}>
                                {opt.label}
                              </span>
                            </label>
                          ))
                        ) : (
                          // Single checkbox (only shown if label exists)
                          localField.label?.trim() && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                style={{
                                  width: '18px',
                                  height: '18px'
                                }}
                                className="checkbox-custom-preview"
                              />
                              <span style={{ 
                                fontSize: localField.fontSize + 'px', 
                                color: localField.textColor,
                                wordWrap: 'break-word',
                                overflowWrap: 'anywhere',
                                flex: '1',
                                minWidth: 0
                              }}>
                                {localField.label}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    ) : (
                      <input
                        type={localField.type === 'phone' ? 'tel' : localField.type}
                        placeholder={localField.placeholder}
                        pattern={localField.type === 'phone' ? '[0-9]*' : undefined}
                        inputMode={localField.type === 'phone' ? 'numeric' : undefined}
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
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 cursor-pointer' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default FieldEditorPopup;

