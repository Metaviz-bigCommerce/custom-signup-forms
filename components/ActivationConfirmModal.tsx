'use client'

import React from 'react';
import { Power, XCircle, X } from 'lucide-react';

interface ActivationConfirmModalProps {
  isOpen: boolean;
  version: any | null;
  isCurrentlyActive: boolean;
  onClose: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onLoad?: () => void;
}

export default function ActivationConfirmModal({
  isOpen,
  version,
  isCurrentlyActive,
  onClose,
  onActivate,
  onDeactivate,
  onLoad,
}: ActivationConfirmModalProps) {
  if (!isOpen || !version) return null;

  const canActivate = !isCurrentlyActive;
  const canDeactivate = isCurrentlyActive;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Form Actions</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-900 mb-1">{version.name || 'Unnamed'}</h4>
            <div className="flex items-center gap-2 mb-4">
              {isCurrentlyActive && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-300 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Active
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {canActivate && (
              <button
                onClick={() => {
                  onActivate();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                <span>Activate This Form</span>
              </button>
            )}

            {canDeactivate && (
              <button
                onClick={() => {
                  onDeactivate();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-lg text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Deactivate Form</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onLoad) onLoad();
                onClose();
              }}
              className="w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer"
            >
              Load into Builder
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

