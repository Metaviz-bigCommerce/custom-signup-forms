'use client'

import React from 'react';
import { PanelRight, FilePlus, Info } from 'lucide-react';
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
  onCreateNewForm: () => void;
  hasSavedForms: boolean;
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
  onCreateNewForm,
  hasSavedForms,
}) => {
  const isEmpty = formFields.length === 0;
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background decorative elements - Enhanced responsive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-gradient-to-tr from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-indigo-500/3 to-purple-500/3 rounded-full blur-3xl" />
      </div>

      <div className={`flex flex-col lg:flex-row h-full transition-all duration-500 ease-in-out relative z-10 ${sidebarOpen && !isEmpty ? 'lg:gap-3 xl:gap-4 2xl:gap-6' : 'gap-0'}`}>
        {/* Enhanced floating toggle button when sidebar is closed and form has fields */}
        {!sidebarOpen && !isEmpty && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-40 animate-fadeIn hidden lg:block">
            <button
              onClick={() => onSidebarToggle(true)}
              className="relative w-12 h-16 lg:w-14 lg:h-20 xl:w-16 xl:h-24 bg-gradient-to-br from-white via-white to-slate-50 border-r-2 border-t-2 border-b-2 border-slate-200 rounded-r-xl lg:rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1.5 lg:gap-2 group hover:scale-105 hover:border-blue-400/50 backdrop-blur-md bg-white/98 hover:-translate-x-1 cursor-pointer touch-manipulation"
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              {/* Animated glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-600/0 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 rounded-r-xl lg:rounded-r-2xl blur-xl transition-all duration-300 -z-10" />
              
              {/* Animated icon container */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <PanelRight className="relative w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-slate-600 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              </div>
              
              {/* Decorative dot indicator with staggered animations */}
              <div className="flex gap-1 lg:gap-1.5">
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 xl:w-2 xl:h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-all duration-300 group-hover:scale-125" />
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 xl:w-2 xl:h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-all duration-300 group-hover:scale-125" style={{ transitionDelay: '75ms' }} />
                <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 xl:w-2 xl:h-2 rounded-full bg-slate-300 group-hover:bg-purple-500 transition-all duration-300 group-hover:scale-125" style={{ transitionDelay: '150ms' }} />
              </div>

              {/* Tooltip text (appears on hover) */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl z-50 hidden xl:block">
                Show Form Fields
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </span>
            </button>
          </div>
        )}

        {/* Mobile sidebar toggle button - Always visible on mobile when form has fields */}
        {!isEmpty && (
          <div className="lg:hidden fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] pointer-events-none">
            <button
              onClick={() => onSidebarToggle(!sidebarOpen)}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95 cursor-pointer touch-manipulation pointer-events-auto"
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              <PanelRight className={`w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Sidebar - Only show when form has fields */}
        {!isEmpty && (
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
        )}

        {/* Enhanced Preview Area with beautiful container - Fully responsive */}
        <div className="h-full overflow-hidden transition-all duration-500 ease-in-out flex-1 min-w-0 w-full">
          {isEmpty ? (
            <div className="relative h-full overflow-y-auto overflow-x-hidden lg:p-2 xl:p-4">
              <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 2xl:p-10">
                <EmptyStateView onCreateNewForm={onCreateNewForm} hasSavedForms={hasSavedForms} />
              </div>
            </div>
          ) : (
            <div className="relative h-full lg:p-2 xl:p-4 overflow-hidden flex flex-col">
              {/* Content wrapper with enhanced styling - no padding on mobile, no overflow */}
              <div className="relative w-full flex-1 min-h-0 flex flex-col">
                <div className="flex-shrink-0">
                  <LivePreview
                    formFields={formFields}
                    theme={theme}
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                  />
                </div>
                {/* Info text about mandatory fields - Enhanced responsive */}
                <div className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 mx-0 sm:mx-2 md:mx-3 lg:mx-4 mb-2 sm:mb-3 md:mb-4 p-2.5 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 border border-blue-200/50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-start gap-2 sm:gap-2.5 md:gap-3 shadow-sm flex-shrink-0 relative z-10">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 mb-0.5 sm:mb-1 md:mb-1.5">Note</p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-blue-700 leading-relaxed break-words">
                      First Name, Last Name, Email, and Password are mandatory fields required by BigCommerce and cannot be deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

// Empty State Component - Enhanced fully responsive design
const EmptyStateView: React.FC<{ onCreateNewForm: () => void; hasSavedForms: boolean }> = ({ onCreateNewForm, hasSavedForms }) => {
  return (
    <div className="h-full flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 2xl:p-10">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden max-w-2xl w-full mx-auto">
        {/* Header - Enhanced fully responsive */}
        <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-3.5 lg:py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-sm flex-shrink-0">
              <FilePlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-slate-800 truncate">No Form Selected</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-500 truncate">{hasSavedForms ? 'Create a new form or select an existing one' : 'Create a new form to get started'}</p>
            </div>
          </div>
        </div>
        
        {/* Empty State Content - Enhanced fully responsive */}
        <div className="p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12 text-center">
          <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 md:mb-5 lg:mb-6 rounded-full bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex items-center justify-center shadow-sm">
              <FilePlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-blue-600" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2 sm:mb-2.5 md:mb-3 px-2 sm:px-3 md:px-4">
              {hasSavedForms ? 'Create a New Form' : 'Create Your First Form'}
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 mb-2 sm:mb-2.5 md:mb-3 px-3 sm:px-4 md:px-5 max-w-lg mx-auto leading-relaxed">
              {hasSavedForms 
                ? 'Start building a new custom signup form with our intuitive form builder.'
                : 'Start building your custom signup form with our intuitive form builder.'
              }
            </p>
            {hasSavedForms && (
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-slate-500 mt-1.5 sm:mt-2 md:mt-2.5 px-3 sm:px-4 md:px-5">
                You can also select an existing form to edit it.
              </p>
            )}
          </div>
          
          <button
            onClick={onCreateNewForm}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 lg:px-7 py-2 sm:py-2.5 md:py-3 lg:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer touch-manipulation"
          >
            <FilePlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            <span>Create New Form</span>
          </button>
          
          {/* Info about mandatory fields - Enhanced fully responsive */}
          <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-8 p-2.5 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/30 border border-blue-200/50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-start gap-2 sm:gap-2.5 md:gap-3 text-left max-w-lg mx-auto shadow-sm">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-1" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-900 mb-0.5 sm:mb-1 md:mb-1.5">Note</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-blue-700 leading-relaxed break-words">
                First Name, Last Name, Email, and Password are required by BigCommerce and will be included automatically. These fields cannot be deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuilderTab;

