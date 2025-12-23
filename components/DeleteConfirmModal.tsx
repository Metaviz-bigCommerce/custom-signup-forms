'use client'

import React from 'react';
import { Trash2, Loader2, XCircle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  formName?: string;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  formName,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border-2 ${
          error ? 'border-red-200' : 'border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">Delete Form</h3>
              {formName && (
                <p className="text-sm text-gray-600 mt-0.5">{formName}</p>
              )}
            </div>
            {!isLoading && (
              <button
                onClick={onCancel}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-4" />
              <p className="text-sm text-gray-600">Deleting form...</p>
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error occurred</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          {!isLoading && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this form? This action cannot be undone.
              </p>
            </div>
          )}

          {/* Buttons */}
          {!isLoading && (
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

