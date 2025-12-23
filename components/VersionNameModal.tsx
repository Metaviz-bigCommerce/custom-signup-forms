'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface VersionNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  title: string;
  placeholder?: string;
  required?: boolean;
  initialName?: string;
}

export default function VersionNameModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder = 'Enter name...',
  required = true,
  initialName = '',
}: VersionNameModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !name.trim()) {
      return;
    }
    onConfirm(name.trim());
    setName('');
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={required && !name.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                required && !name.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
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

