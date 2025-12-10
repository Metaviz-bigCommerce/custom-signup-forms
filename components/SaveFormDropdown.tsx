'use client'

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Save, ChevronDown, Loader2 } from 'lucide-react';
import VersionNameModal from './VersionNameModal';

interface SaveFormDropdownProps {
  isDirty: boolean;
  isSaving: boolean;
  currentFormName?: string;
  onSave: () => Promise<void>;
  onSaveAsDraft: (name: string) => Promise<void>;
  onSaveAsVersion: (name: string) => Promise<void>;
}

export default function SaveFormDropdown({
  isDirty,
  isSaving,
  currentFormName = 'Unnamed',
  onSave,
  onSaveAsDraft,
  onSaveAsVersion,
}: SaveFormDropdownProps) {
  const isUnnamed = currentFormName === 'Unnamed';
  const [isOpen, setIsOpen] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
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

  const handleSaveAsDraft = async (name: string) => {
    setShowDraftModal(false);
    setIsOpen(false);
    // Use provided name, or current name if not unnamed, or generate default
    const finalName = name.trim() || (!isUnnamed ? currentFormName : `Draft ${new Date().toLocaleDateString()}`);
    await onSaveAsDraft(finalName);
  };

  const handleSaveAsVersion = async (name: string) => {
    setShowVersionModal(false);
    setIsOpen(false);
    // Use provided name, or current name if not unnamed (required for version)
    const finalName = name.trim() || (!isUnnamed ? currentFormName : '');
    await onSaveAsVersion(finalName);
  };

  const dropdownContent = isOpen && isDirty && !isSaving ? (
    <div
      ref={dropdownRef}
      className="fixed w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[9999]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        <span>Save</span>
      </button>
      <button
        onClick={() => {
          setIsOpen(false);
          setShowDraftModal(true);
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        <span>Save as Draft</span>
      </button>
      <button
        onClick={() => {
          setIsOpen(false);
          setShowVersionModal(true);
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        <span>Save as New Version</span>
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

      <VersionNameModal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        onConfirm={handleSaveAsDraft}
        title="Save as Draft"
        placeholder={isUnnamed ? "Enter draft name (optional)" : "Enter draft name or use current"}
        required={false}
        initialName={!isUnnamed ? currentFormName : ''}
      />

      <VersionNameModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onConfirm={handleSaveAsVersion}
        title="Save as New Version"
        placeholder={isUnnamed ? "Enter version name" : "Enter version name or use current"}
        required={isUnnamed}
        initialName={!isUnnamed ? currentFormName : ''}
      />
    </>
  );
}

