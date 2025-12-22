'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToExisting: (name: string) => void;
  onSaveAsNew: (name: string) => void;
  currentFormName?: string;
  isNewForm: boolean;
}

export default function SaveModal({
  isOpen,
  onClose,
  onSaveToExisting,
  onSaveAsNew,
  currentFormName = 'Unnamed',
  isNewForm,
}: SaveModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saveOption, setSaveOption] = useState<'existing' | 'new'>('existing');

  useEffect(() => {
    if (isOpen) {
      // Prefill with current name if not "Unnamed"
      const initialName = currentFormName !== 'Unnamed' ? currentFormName : '';
      setName(initialName);
      setError('');
      setSaveOption('existing');
    }
  }, [isOpen, currentFormName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    
    if (isNewForm) {
      // For new forms, just save with the name
      onSaveAsNew(trimmedName);
    } else {
      // For existing forms, use the selected option
      if (saveOption === 'existing') {
        onSaveToExisting(trimmedName);
      } else {
        onSaveAsNew(trimmedName);
      }
    }
    
    setName('');
    setError('');
  };

  const handleClose = () => {
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Save Form</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {isNewForm ? (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-4">
                This form will be saved as: <span className="font-semibold text-gray-900">{name.trim() || '[form name]'}</span>
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Save Option
              </label>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  saveOption === 'existing'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="saveOption"
                    value="existing"
                    checked={saveOption === 'existing'}
                    onChange={() => setSaveOption('existing')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">Save to existing form</span>
                    <p className="text-xs text-gray-600 mt-1">Update the current form with your changes</p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  saveOption === 'new'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="saveOption"
                    value="new"
                    checked={saveOption === 'new'}
                    onChange={() => setSaveOption('new')}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">Save as new form</span>
                    <p className="text-xs text-gray-600 mt-1">Create a new form with a different name</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter name..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                error ? 'border-red-300' : 'border-slate-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                !name.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

