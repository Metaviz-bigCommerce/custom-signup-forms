'use client'

import React, { useState } from 'react';
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
    <div className={`flex h-full transition-all duration-300 ease-in-out relative ${sidebarOpen ? 'gap-6' : 'gap-0'}`}>
      {/* Floating toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => onSidebarToggle(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 w-11 h-16 bg-white border-r border-t border-b border-slate-200 rounded-r-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center hover:bg-gray-50 group backdrop-blur-sm bg-white/95"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <PanelRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
        </button>
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

      {/* Preview Area */}
      <div className={`h-full overflow-y-auto transition-all duration-300 ease-in-out flex-1 min-w-0`}>
        <LivePreview
          formFields={formFields}
          theme={theme}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      </div>
    </div>
  );
};

export default BuilderTab;

