'use client'

import React from 'react';
import { RotateCcw, X, Edit2, Check } from 'lucide-react';
import SaveFormDropdown from '@/components/SaveFormDropdown';

interface TopActionBarProps {
  currentFormName: string;
  isEditingName: boolean;
  editingName: string;
  isDirty: boolean;
  isSaving: boolean;
  isNewForm: boolean;
  onNameChange: (name: string) => void;
  onStartEditing: () => void;
  onSaveName: () => void;
  onCancelEditing: () => void;
  onReset: () => void;
  onDiscard: () => void;
  onSaveToExisting: (name: string) => Promise<void>;
  onSaveAsNew: (name: string) => Promise<void>;
  onBeforeSave?: () => void;
}

const TopActionBar: React.FC<TopActionBarProps> = ({
  currentFormName,
  isEditingName,
  editingName,
  isDirty,
  isSaving,
  isNewForm,
  onNameChange,
  onStartEditing,
  onSaveName,
  onCancelEditing,
  onReset,
  onDiscard,
  onSaveToExisting,
  onSaveAsNew,
  onBeforeSave,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4">
      <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between relative">
        {/* Left Section - Status & Info */}
        <div className="flex items-center gap-4">
          {/* Form Name */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => onNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSaveName();
                    } else if (e.key === 'Escape') {
                      onCancelEditing();
                    }
                  }}
                  className="px-3 py-1.5 text-lg font-semibold text-gray-800 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={onSaveName}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Save name"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={onCancelEditing}
                  className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 
                  className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={onStartEditing}
                  title="Click to edit name"
                >
                  {currentFormName}
                </h2>
                <button
                  onClick={onStartEditing}
                  className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 rounded-md transition-all"
                  title="Edit name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {isDirty && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span>Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Secondary Actions - Icon Only */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
            {/* Discard Button - Icon Only (only when dirty) */}
            {isDirty && (
              <button
                onClick={onDiscard}
                className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-[0.95]"
                title="Discard unsaved changes"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <SaveFormDropdown
              isDirty={isDirty}
              isSaving={isSaving}
              currentFormName={currentFormName}
              isNewForm={isNewForm}
              onSaveToExisting={onSaveToExisting}
              onSaveAsNew={onSaveAsNew}
              onBeforeSave={onBeforeSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopActionBar;

