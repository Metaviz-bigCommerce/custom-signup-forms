'use client'

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, ChevronDown, Loader2 } from 'lucide-react';
import SaveAsModal from './SaveAsModal';

interface SaveFormDropdownProps {
  isDirty: boolean;
  isSaving: boolean;
  currentFormName?: string;
  onSave: () => Promise<void>;
  onSaveAs: (name: string, type: 'draft' | 'version') => Promise<void>;
}

export default function SaveFormDropdown({
  isDirty,
  isSaving,
  currentFormName = 'Unnamed',
  onSave,
  onSaveAs,
}: SaveFormDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX,
      });
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSave = async () => {
    setIsOpen(false);
    await onSave();
  };

  const handleSaveAs = async (name: string, type: 'draft' | 'version') => {
    setShowSaveAsModal(false);
    setIsOpen(false);
    await onSaveAs(name, type);
  };

  const dropdownContent = isOpen && isDirty && !isSaving ? (
    <div
      ref={dropdownRef}
      className="fixed w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      <button
        onClick={handleSave}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-100"
      >
        <Save className="w-4 h-4 text-blue-600" />
        <div className="flex flex-col">
          <span className="font-medium">Save</span>
          <span className="text-xs text-gray-500">Save current changes</span>
        </div>
      </button>
      <button
        onClick={() => {
          setIsOpen(false);
          setShowSaveAsModal(true);
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
      >
        <Save className="w-4 h-4 text-blue-600" />
        <div className="flex flex-col">
          <span className="font-medium">Save As</span>
          <span className="text-xs text-gray-500">Create a new version</span>
        </div>
      </button>
    </div>
  ) : null;

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => !isSaving && isDirty && setIsOpen(!isOpen)}
          disabled={!isDirty || isSaving}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            isDirty && !isSaving
              ? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title={!isDirty ? 'No changes to save' : 'Save form changes'}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Form</span>
              {isDirty && (
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              )}
            </>
          )}
        </button>
      </div>

      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}

      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        onConfirm={handleSaveAs}
        currentFormName={currentFormName}
      />
    </>
  );
}

