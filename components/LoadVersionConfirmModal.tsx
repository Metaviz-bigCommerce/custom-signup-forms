'use client'

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface LoadVersionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmAndGoToBuilder: () => void;
  onSaveAndContinue?: () => Promise<void>;
  versionName?: string;
}

export default function LoadVersionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onConfirmAndGoToBuilder,
  onSaveAndContinue,
  versionName,
}: LoadVersionConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Unsaved Changes</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-2">
            You have unsaved changes. What would you like to do?
          </p>
          
          <div className="flex flex-col gap-3">
            {onSaveAndContinue && (
              <button
                onClick={async () => {
                  await onSaveAndContinue();
                  onConfirm();
                }}
                className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Save, then load</span>
              </button>
            )}
            <button
              onClick={onConfirmAndGoToBuilder}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>Discard changes & load form</span>
            </button>
            <button
              onClick={onConfirm}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>Load Form</span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Stay here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

