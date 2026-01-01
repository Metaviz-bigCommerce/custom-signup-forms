import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange }) => (
  <div className="w-full min-w-0">
    <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
    <div className="flex gap-2 items-center min-w-0">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 rounded-md border border-slate-300 cursor-pointer flex-shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-[90px] max-w-full px-2 sm:px-3 py-2 h-10 border border-slate-300 rounded-md text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="#000000"
        style={{ minWidth: '90px' }}
      />
    </div>
  </div>
);

