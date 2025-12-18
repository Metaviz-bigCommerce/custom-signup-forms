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
    <aside 
      className={`bg-white rounded-xl shadow-md border border-slate-200 h-full overflow-hidden transition-all duration-300 ease-in-out relative ${
        isOpen 
          ? 'w-[25%] min-w-[280px] opacity-100' 
          : 'w-0 min-w-0 opacity-0 overflow-hidden border-0'
      }`}
    >
      {isOpen && (
        <>
          {/* Sidebar Header with Toggle */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 backdrop-blur-sm bg-white/95">
            <h3 className="text-lg font-semibold text-gray-800">Simple Form</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
              aria-label="Hide sidebar"
              title="Hide sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="p-6 h-[calc(100%-73px)] overflow-y-auto">
            <div className="mb-6">
              <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Add New Field</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Basic Inputs</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['text', 'email', 'phone', 'number'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Selection Fields</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['textarea', 'select', 'radio', 'checkbox'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Address Fields</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onAddAddressField('country')}
                      className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Country
                    </button>
                    <button
                      onClick={() => onAddAddressField('state')}
                      className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      State / Province
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-gray-400 mb-1.5 font-medium">Special Fields</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['date', 'file', 'url'].map(type => (
                      <button
                        key={type}
                        onClick={() => onAddField(type as FieldType)}
                        className="text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-2 py-1.5 rounded-md border border-slate-200 hover:border-blue-300 transition-all capitalize"
                      >
                        <Plus className="w-3 h-3 inline mr-1" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <button
                onClick={onOpenThemeEditor}
                className="w-full px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-slate-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Edit Theme
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Form Fields</h3>
              <div className="space-y-3">
                {fieldGroups.map((group) => {
                  const groupStartIndex = formFields.findIndex(f => f.id === group.fields[0].id);
                  
                  if (group.isPaired && group.fields.length === 2) {
                    const [field1, field2] = group.fields;
                    const isDragging1 = draggedFieldId === field1.id;
                    const isDragging2 = draggedFieldId === field2.id;
                    
                    return (
                      <div 
                        key={`pair-${group.rowGroup}`}
                        className="border-2 border-purple-400 bg-purple-50/50 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200">
                          <Columns className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Paired Fields</span>
                        </div>
                        
                        <div className="space-y-2">
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
                                className={`flex items-center gap-3 p-2.5 rounded-md border cursor-move transition-all duration-200 ${
                                  isDraggingField
                                    ? 'opacity-50 bg-gray-100 border-gray-300'
                                    : isDragOverField
                                      ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-sm'
                                      : selectedField?.id === field.id
                                        ? 'border-blue-400 bg-blue-50 shadow-sm'
                                        : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm'
                                }`}
                              >
                                <GripVertical className="w-4 h-4 text-purple-500 cursor-grab active:cursor-grabbing flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">{field.label}</div>
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
                                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                                    className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                                    title="Unpair field"
                                  >
                                    <Unlink className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteField(field.id); }}
                                    className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    const nextField = fieldIndex < formFields.length - 1 ? formFields[fieldIndex + 1] : null;
                    const isPairedWithNext = nextField && field.rowGroup != null && nextField.rowGroup === field.rowGroup;
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
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-move transition-all duration-200 ${
                            isDragging
                              ? 'opacity-50 bg-gray-100 border-gray-300'
                              : isDragOver
                                ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-md ring-2 ring-blue-200'
                                : selectedField?.id === field.id 
                                  ? 'border-blue-400 bg-blue-50 shadow-sm' 
                                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-blue-500 transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{field.label}</div>
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
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                                className="p-1.5 rounded-md text-purple-600 hover:text-purple-700 hover:bg-purple-100 transition-colors"
                                title="Unpair field"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteField(field.id); }}
                              className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No fields yet. Add a field to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;

