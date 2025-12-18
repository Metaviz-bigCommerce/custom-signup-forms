'use client'

import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import SaveAsModal from './SaveAsModal';

interface SaveFormDropdownProps {
  isDirty: boolean;
  isSaving: boolean;
  currentFormName?: string;
  onSaveAs: (name: string, type: 'draft' | 'version') => Promise<void>;
}

export default function SaveFormDropdown({
  isDirty,
  isSaving,
  currentFormName = 'Unnamed',
  onSaveAs,
}: SaveFormDropdownProps) {
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);

  const handleSaveAs = async (name: string, type: 'draft' | 'version') => {
    setShowSaveAsModal(false);
    await onSaveAs(name, type);
  };

  // No dropdown needed - directly open Save As modal
  const handleButtonClick = () => {
    if (!isSaving && isDirty) {
      setShowSaveAsModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleButtonClick}
          disabled={!isDirty || isSaving}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            isDirty && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title={!isDirty ? 'No changes to save' : 'Save as Draft or Version'}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save As</span>
            </>
          )}
        </button>
      </div>

      <SaveAsModal
        isOpen={showSaveAsModal}
        onClose={() => setShowSaveAsModal(false)}
        onConfirm={handleSaveAs}
        currentFormName={currentFormName}
      />
    </>
  );
}

