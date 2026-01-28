'use client'

import React from 'react';
import { Plus, Trash2, GripVertical, Palette, PanelLeftClose, Link2, Unlink, Columns } from 'lucide-react';
import { FormField, FieldType } from './types';

interface SidebarProps {
  isOpen: boolean;
  formFields: FormField[];
  selectedField: FormField | null;
  draggedFieldId: number | null;
  dragOverIndex: number | null;
  onClose: () => void;
  onAddField: (type: FieldType) => void;
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
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  formFields,
  selectedField,
  draggedFieldId,
  dragOverIndex,
  onClose,
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
}) => {
  // Group fields by rowGroup for rendering
  const processedIds = new Set<number>();
  const fieldGroups: Array<{ fields: FormField[]; isPaired: boolean; rowGroup: number | null }> = [];
  
  for (let i = 0; i < formFields.length; i++) {
    if (processedIds.has(formFields[i].id)) continue;
    
    const field = formFields[i];
    if (field.rowGroup != null) {
      const groupFields = formFields.filter(f => f.rowGroup === field.rowGroup);
      fieldGroups.push({ fields: groupFields, isPaired: true, rowGroup: field.rowGroup });
      groupFields.forEach(f => processedIds.add(f.id));
    } else {
      fieldGroups.push({ fields: [field], isPaired: false, rowGroup: null });
      processedIds.add(field.id);
    }
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-500"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={`bg-white rounded-xl sm:rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 h-full overflow-hidden transition-all duration-500 ease-in-out relative z-50 ${
          isOpen 
            ? 'w-full sm:w-80 lg:w-[25%] lg:min-w-[280px] xl:min-w-[300px] opacity-100' 
            : 'w-0 min-w-0 opacity-0 overflow-hidden border-0 lg:border-slate-200'
        } ${
          isOpen 
            ? 'fixed lg:relative top-0 left-0 right-0 bottom-0 lg:top-auto lg:left-auto lg:right-auto lg:bottom-auto'
            : 'lg:relative'
        }`}
      >
        {isOpen && (
          <>
            {/* Sidebar Header with Toggle - Enhanced responsive styling */}
            <div className="sticky top-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 backdrop-blur-sm bg-white/95">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                  <Columns className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">Form Fields</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer flex-shrink-0"
                aria-label="Hide sidebar"
                title="Hide sidebar"
              >
                <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

          {/* Sidebar Content - Enhanced responsive */}
          <div className="p-4 sm:p-6 h-[calc(100%-73px)] sm:h-[calc(100%-85px)] overflow-y-auto">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">Add New Field</h4>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-2 font-semibold tracking-wide">Basic Inputs</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['text', 'email', 'phone', 'number'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 capitalize font-medium group cursor-pointer"
                      >
                        <Plus className="w-3 h-3 inline mr-1.5 group-hover:scale-110 transition-transform" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-2 font-semibold tracking-wide">Selection Fields</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['textarea', 'select', 'radio', 'checkbox'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 capitalize font-medium group cursor-pointer"
                      >
                        <Plus className="w-3 h-3 inline mr-1.5 group-hover:scale-110 transition-transform" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-2 font-semibold tracking-wide">Address Fields</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onAddAddressField('country')}
                      className="text-xs bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 font-medium group cursor-pointer"
                    >
                      <Plus className="w-3 h-3 inline mr-1.5 group-hover:scale-110 transition-transform" />
                      Country
                    </button>
                    <button
                      onClick={() => onAddAddressField('state')}
                      className="text-xs bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 font-medium group cursor-pointer"
                    >
                      <Plus className="w-3 h-3 inline mr-1.5 group-hover:scale-110 transition-transform" />
                      State / Province
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500 mb-2 font-semibold tracking-wide">Special Fields</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['date', 'file', 'url'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-slate-700 hover:text-blue-700 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 capitalize font-medium group cursor-pointer"
                      >
                        <Plus className="w-3 h-3 inline mr-1.5 group-hover:scale-110 transition-transform" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <button
                onClick={onOpenThemeEditor}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Edit Theme</span>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-3 sm:pt-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full" />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800">Form Fields</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500">Drag to reorder</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {fieldGroups.map((group) => {
                  if (group.isPaired && group.fields.length === 2) {
                    const [field1, field2] = group.fields;
                    
                    return (
                      <div 
                        key={`pair-${group.rowGroup}`}
                        className="border-2 border-purple-400 bg-purple-50/50 rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                          <Columns className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-semibold text-purple-700 uppercase tracking-wide truncate">Paired Fields</span>
                        </div>
                        
                        <div className="space-y-1.5 sm:space-y-2">
                          {group.fields.map((field, fieldIndex) => {
                            const fieldIndexInList = formFields.findIndex(f => f.id === field.id);
                            const isDraggingField = draggedFieldId === field.id;
                            const isDragOverField = dragOverIndex === fieldIndexInList;
                            const nextFieldInList = fieldIndexInList < formFields.length - 1 ? formFields[fieldIndexInList + 1] : null;
                            const isPairedWithNext = nextFieldInList && field.rowGroup != null && nextFieldInList.rowGroup === field.rowGroup;
                            
                            return (
                              <div
                                key={field.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, field.id)}
                                onDragOver={(e) => onDragOver(e, fieldIndexInList)}
                                onDragLeave={onDragLeave}
                                onDrop={(e) => onDrop(e, fieldIndexInList)}
                                onDragEnd={onDragEnd}
                                onClick={() => onFieldClick(field)}
                                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-md border cursor-move transition-all duration-200 ${
                                  isDraggingField
                                    ? 'opacity-50 bg-gray-100 border-gray-300'
                                    : isDragOverField
                                      ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-sm'
                                      : selectedField?.id === field.id
                                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                                        : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm'
                                }`}
                              >
                                <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 cursor-grab active:cursor-grabbing flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                    {field.type === 'checkbox' && !field.label?.trim() && field.options && field.options.length > 0
                                      ? field.options[0].label
                                      : field.label || 'Unnamed Field'}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                                    {field.locked && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {fieldIndex === 0 && fieldIndexInList < formFields.length - 1 && !isPairedWithNext && (
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onTogglePair(field.id);
                                      }}
                                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                      title="Pair with next field"
                                    >
                                      <Link2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      onUnpairField(field.id);
                                    }}
                                    className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                    title="Unpair field"
                                  >
                                    <Unlink className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteField(field.id); }}
                                    className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Delete field"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    const field = group.fields[0];
                    const fieldIndex = formFields.findIndex(f => f.id === field.id);
                    const isPaired = field.rowGroup != null;
                    const isDragging = draggedFieldId === field.id;
                    const isDragOver = dragOverIndex === fieldIndex;
                    
                    return (
                      <div key={field.id}>
                        <div 
                          draggable
                          onDragStart={(e) => onDragStart(e, field.id)}
                          onDragOver={(e) => onDragOver(e, fieldIndex)}
                          onDragLeave={onDragLeave}
                          onDrop={(e) => onDrop(e, fieldIndex)}
                          onDragEnd={onDragEnd}
                          onClick={() => onFieldClick(field)}
                          className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 cursor-move transition-all duration-200 ${
                            isDragging
                              ? 'opacity-50 bg-gray-100 border-gray-300'
                              : isDragOver
                                ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md ring-2 ring-blue-200'
                                : selectedField?.id === field.id 
                                  ? 'border-blue-400 bg-blue-50 shadow-sm' 
                                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                          }`}
                        >
                          <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-blue-500 transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                              {field.type === 'checkbox' && !field.label?.trim() && field.options && field.options.length > 0
                                ? field.options[0].label
                                : field.label || 'Unnamed Field'}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                              {field.locked && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!isPaired && fieldIndex < formFields.length - 1 && (
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  onTogglePair(field.id);
                                }}
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Pair with next field"
                              >
                                <Link2 className="w-4 h-4" />
                              </button>
                            )}
                            {isPaired && (
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  onUnpairField(field.id);
                                }}
                                className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                title="Unpair field"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteField(field.id); }}
                              className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
                {formFields.length === 0 && (
                  <div className="text-center py-6 sm:py-8 text-gray-400">
                    <p className="text-xs sm:text-sm">No fields yet. Add a field to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
    </>
  );
};

export default Sidebar;

