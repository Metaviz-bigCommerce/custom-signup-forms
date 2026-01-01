'use client'

import React from 'react';
import { X, AlertTriangle, Save, Trash2, XCircle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveAndSwitch: () => void; // Changed: now triggers SaveAsModal instead of directly saving
  context?: string;
}

export default function UnsavedChangesModal({
  isOpen,
  onClose,
  onDiscard,
  onSaveAndSwitch,
  context = 'switching tabs',
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border border-slate-200/50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-message"
      >
        {/* Header with gradient background */}
        <div className="relative px-6 py-5 border-b border-slate-200/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/20 rounded-xl blur-md" />
                <div className="relative p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl shadow-sm border border-amber-300/50">
                  <AlertTriangle className="w-5 h-5 text-amber-700" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h3 id="unsaved-changes-title" className="text-lg font-bold text-slate-800 tracking-tight">
                  Unsaved Changes
                </h3>
                <p className="text-xs text-amber-700/80 font-medium mt-0.5">Action required</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p id="unsaved-changes-message" className="text-sm text-slate-600 mb-6 leading-relaxed">
            You have unsaved changes. What would you like to do?
          </p>
          
          <div className="flex flex-col gap-3">
            {/* Save & Switch Button */}
            <button
              onClick={onSaveAndSwitch}
              className="group relative w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Save className="w-4 h-4 relative z-10" strokeWidth={2.5} />
              <span className="relative z-10">Save & switch</span>
            </button>

            {/* Discard & Switch Button */}
            <button
              onClick={onDiscard}
              className="group relative w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Trash2 className="w-4 h-4 relative z-10" strokeWidth={2.5} />
              <span className="relative z-10">Discard & switch</span>
            </button>

            {/* Stay Here Button */}
            <button
              onClick={onClose}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <XCircle className="w-4 h-4" strokeWidth={2.5} />
              <span>Stay here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

