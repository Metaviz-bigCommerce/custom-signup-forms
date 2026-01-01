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

  // Allow saving if form is dirty OR if it's a new form that hasn't been saved yet
  const canSave = isDirty || (isNewForm && !isSaving);

  const handleButtonClick = () => {
    if (!isSaving && canSave) {
      setShowSaveModal(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
        <button
          onClick={handleButtonClick}
          disabled={!canSave || isSaving}
          className={`px-2 sm:px-3 md:px-4 lg:px-5 py-1 sm:py-1.5 md:py-2 rounded-lg text-[9px] sm:text-sm md:text-sm font-semibold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 md:gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation ${
            canSave && !isSaving
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] shadow-md cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          title={!canSave ? 'No changes to save' : 'Save form'}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 animate-spin flex-shrink-0" />
              <span className="whitespace-nowrap">Saving…</span>
            </>
          ) : (
            <>
              <Save className="w-3 h-3 sm:w-4 sm:h-4 md:w-4 md:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Save</span>
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

