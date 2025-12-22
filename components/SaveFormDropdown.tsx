'use client'

import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import SaveModal from './SaveModal';

interface SaveFormDropdownProps {
  isDirty: boolean;
  isSaving: boolean;
  currentFormName?: string;
  isNewForm: boolean;
  onSaveToExisting: (name: string) => Promise<void>;
  onSaveAsNew: (name: string) => Promise<void>;
}

export default function SaveFormDropdown({
  isDirty,
  isSaving,
  currentFormName = 'Unnamed',
  isNewForm,
  onSaveToExisting,
  onSaveAsNew,
}: SaveFormDropdownProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSaveToExisting = async (name: string) => {
    setShowSaveModal(false);
    await onSaveToExisting(name);
  };

  const handleSaveAsNew = async (name: string) => {
    setShowSaveModal(false);
    await onSaveAsNew(name);
  };

  const handleButtonClick = () => {
    if (!isSaving && isDirty) {
      setShowSaveModal(true);
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
          title={!isDirty ? 'No changes to save' : 'Save form'}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaveToExisting={handleSaveToExisting}
        onSaveAsNew={handleSaveAsNew}
        currentFormName={currentFormName}
        isNewForm={isNewForm}
      />
    </>
  );
}

