'use client'

import React from 'react';
import { PanelRight } from 'lucide-react';
import Sidebar from './Sidebar';
import LivePreview from './LivePreview';
import { FormField } from './types';

interface BuilderTabProps {
  formFields: FormField[];
  theme: any;
  selectedField: FormField | null;
  draggedFieldId: number | null;
  dragOverIndex: number | null;
  sidebarOpen: boolean;
  viewMode: 'desktop' | 'mobile';
  onSidebarToggle: (open: boolean) => void;
  onAddField: (type: any) => void;
  onAddAddressField: (role: 'country' | 'state') => void;
  onFieldClick: (field: FormField) => void;
  onDeleteField: (id: number) => void;
  onTogglePair: (fieldId: number) => void;
  onUnpairField: (fieldId: number) => void;
  onDragStart: (e: React.DragEvent, fieldId: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onOpenThemeEditor: () => void;
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
}

const BuilderTab: React.FC<BuilderTabProps> = ({
  formFields,
  theme,
  selectedField,
  draggedFieldId,
  dragOverIndex,
  sidebarOpen,
  viewMode,
  onSidebarToggle,
  onAddField,
  onAddAddressField,
  onFieldClick,
  onDeleteField,
  onTogglePair,
  onUnpairField,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onOpenThemeEditor,
  onViewModeChange,
}) => {
  return (
    <div className="relative h-full">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className={`flex h-full transition-all duration-500 ease-in-out relative z-10 ${sidebarOpen ? 'gap-6' : 'gap-0'}`}>
        {/* Enhanced floating toggle button when sidebar is closed */}
        {!sidebarOpen && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 animate-fadeIn">
            <button
              onClick={() => onSidebarToggle(true)}
              className="relative w-14 h-20 bg-gradient-to-br from-white via-white to-slate-50 border-r-2 border-t-2 border-b-2 border-slate-200 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center gap-2 group hover:scale-105 hover:border-blue-400/50 backdrop-blur-md bg-white/98 hover:-translate-x-1"
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              {/* Animated glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 rounded-r-2xl blur-xl transition-all duration-300 -z-10" />
              
              {/* Animated icon container */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <PanelRight className="relative w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              </div>
              
              {/* Decorative dot indicator with staggered animations */}
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-all duration-300 group-hover:scale-125" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-all duration-300 group-hover:scale-125" style={{ transitionDelay: '75ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-purple-500 transition-all duration-300 group-hover:scale-125" style={{ transitionDelay: '150ms' }} />
              </div>

              {/* Tooltip text (appears on hover) */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl z-50">
                Show Form Fields
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </span>
            </button>
          </div>
        )}

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          formFields={formFields}
          selectedField={selectedField}
          draggedFieldId={draggedFieldId}
          dragOverIndex={dragOverIndex}
          onClose={() => onSidebarToggle(false)}
          onAddField={onAddField}
          onAddAddressField={onAddAddressField}
          onFieldClick={onFieldClick}
          onDeleteField={onDeleteField}
          onTogglePair={onTogglePair}
          onUnpairField={onUnpairField}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onOpenThemeEditor={onOpenThemeEditor}
        />

        {/* Enhanced Preview Area with beautiful container */}
        <div className="h-full overflow-y-auto transition-all duration-500 ease-in-out flex-1 min-w-0">
          <div className="relative h-full p-2">
            {/* Animated background gradient overlay */}
            <div className="absolute inset-2 bg-gradient-to-br from-blue-50/50 via-white/80 to-purple-50/50 rounded-2xl pointer-events-none transition-opacity duration-500" />
            
            {/* Subtle animated orbs in background for depth */}
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/8 to-indigo-400/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-to-tr from-purple-400/8 to-pink-400/8 rounded-full blur-3xl pointer-events-none" />
            
            {/* Content wrapper with enhanced styling */}
            <div className="relative h-full">
              <LivePreview
                formFields={formFields}
                theme={theme}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
              />
            </div>

            {/* Decorative corner accents when sidebar is closed */}
            {!sidebarOpen && (
              <>
                <div className="absolute top-2 left-2 w-48 h-48 bg-gradient-to-br from-blue-500/6 to-indigo-500/6 rounded-br-2xl pointer-events-none transition-opacity duration-500" />
                <div className="absolute top-2 right-2 w-40 h-40 bg-gradient-to-bl from-purple-500/5 to-pink-500/5 rounded-bl-2xl pointer-events-none transition-opacity duration-500" />
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BuilderTab;

