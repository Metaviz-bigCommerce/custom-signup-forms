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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-2 sm:mb-3 md:mb-4">
      <div className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4">
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-2 min-[360px]:space-y-2.5">
          {/* Form Name Editing - Show above action bar when editing */}
          {isEditingName && (
            <div className="flex items-center gap-2 w-full">
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
                className="px-2 py-1.5 min-[360px]:px-2.5 min-[360px]:py-2 text-sm font-semibold text-gray-800 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                autoFocus
              />
              <button
                onClick={onSaveName}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
                title="Save name"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEditing}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Bar Row */}
          <div className="flex flex-row flex-wrap items-center gap-2 min-[360px]:gap-2.5">
            {/* Form Name - Only show when NOT editing */}
            {!isEditingName && (
              <div className="flex items-center gap-1.5 min-[360px]:gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-[360px]:gap-2 group min-w-0 flex-1">
                  <h2 
                    className="text-[10px] min-[360px]:text-[11px] sm:text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors truncate min-w-0"
                    onClick={onStartEditing}
                    title={currentFormName}
                  >
                    {currentFormName}
                  </h2>
                  <button
                    onClick={onStartEditing}
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 rounded-md transition-all cursor-pointer flex-shrink-0 touch-manipulation"
                    title="Edit name"
                  >
                    <Edit2 className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Unsaved Changes Badge + Action Buttons */}
            {isDirty && (
              <div className="flex flex-wrap items-center gap-2 min-[360px]:gap-2.5">
                {/* Unsaved Changes Badge */}
                <div className="flex items-center gap-1 min-[360px]:gap-1.5 px-1.5 py-0.5 min-[360px]:px-2 min-[360px]:py-1 rounded-md bg-amber-50 text-amber-700 text-[9px] min-[360px]:text-[10px] sm:text-xs font-medium border border-amber-200 whitespace-nowrap flex-shrink-0">
                  <div className="w-1 h-1 min-[360px]:w-1.5 min-[360px]:h-1.5 sm:w-1.5 sm:h-1.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <span>Unsaved changes</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 min-[360px]:gap-1.5 flex-shrink-0">
                  {/* Discard Button - Icon with Text */}
                  <button
                    onClick={onDiscard}
                    className="px-2 py-1 min-[360px]:px-2.5 min-[360px]:py-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-[0.95] cursor-pointer touch-manipulation flex items-center gap-1 min-[360px]:gap-1.5"
                    title="Discard unsaved changes"
                  >
                    <X className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-[9px] min-[360px]:text-[10px] sm:text-xs font-medium whitespace-nowrap">Discard</span>
                  </button>

                  {/* Save Button */}
                  <SaveFormDropdown
                    isDirty={isDirty}
                    isSaving={isSaving}
                    currentFormName={currentFormName}
                    isNewForm={isNewForm}
                    onSaveToExisting={onSaveToExisting}
                    onSaveAsNew={onSaveAsNew}
                  />
                </div>
              </div>
            )}

            {/* Save Button Only (when not dirty) */}
            {!isDirty && (
              <div className="flex items-center flex-shrink-0">
                <SaveFormDropdown
                  isDirty={isDirty}
                  isSaving={isSaving}
                  currentFormName={currentFormName}
                  isNewForm={isNewForm}
                  onSaveToExisting={onSaveToExisting}
                  onSaveAsNew={onSaveAsNew}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout: Single Row */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Left Section - Status & Info */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* Form Name */}
            <div className="flex items-center gap-2 min-w-0 flex-1 max-w-full">
              {isEditingName ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
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
                    className="px-3 py-1.5 text-sm md:text-lg font-semibold text-gray-800 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-0"
                    autoFocus
                  />
                  <button
                    onClick={onSaveName}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onCancelEditing}
                    className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors cursor-pointer flex-shrink-0 touch-manipulation"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group min-w-0 flex-1">
                  <h2 
                    className="text-sm md:text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors truncate min-w-0"
                    onClick={onStartEditing}
                    title={currentFormName}
                  >
                    {currentFormName}
                  </h2>
                  <button
                    onClick={onStartEditing}
                    className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 rounded-md transition-all cursor-pointer flex-shrink-0 touch-manipulation"
                    title="Edit name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {isDirty && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 whitespace-nowrap flex-shrink-0">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
              <span>Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {/* Secondary Actions - Icon with Text */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-2">
              {/* Discard Button - Icon with Text (only when dirty) */}
            {isDirty && (
              <button
                onClick={onDiscard}
                  className="px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-[0.95] cursor-pointer touch-manipulation flex items-center gap-1.5"
                title="Discard unsaved changes"
              >
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">Discard</span>
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
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopActionBar;

