'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/session';
import { useToast } from '@/components/common/Toast';
import { Clock, Save, AlertCircle } from 'lucide-react';

const CooldownConfig: React.FC = () => {
  const { context } = useSession();
  const toast = useToast();
  const [cooldownDays, setCooldownDays] = useState<number>(7);
  const [originalDays, setOriginalDays] = useState<number>(7);
  const [inputValue, setInputValue] = useState<string>('7');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/cooldown-config?context=${encodeURIComponent(context)}`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to load cooldown configuration');
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.message || 'Failed to load cooldown configuration');
        }
        const days = data.data?.days ?? 7;
        setCooldownDays(days);
        setOriginalDays(days);
        setInputValue(days.toString());
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load cooldown configuration';
        setError(message);
        toast.showError(message);
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [context, toast]);

  const validateValue = (value: number | string): { isValid: boolean; error: string | null; numericValue: number } => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(numValue) || numValue < 1 || numValue > 365) {
      return {
        isValid: false,
        error: 'Please enter a value between 1 and 365.',
        numericValue: numValue
      };
    }
    
    return {
      isValid: true,
      error: null,
      numericValue: numValue
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Allow empty string for better UX while typing
    if (rawValue === '') {
      setInputValue('');
      setCooldownDays(0);
      setValidationError('Please enter a value between 1 and 365.');
      return;
    }
    
    // Remove any non-numeric characters
    const numericOnly = rawValue.replace(/[^0-9]/g, '');
    
    // Prevent leading zeros: if the value starts with 0 and has more digits, remove the leading zero
    let cleanedValue = numericOnly;
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0')) {
      cleanedValue = cleanedValue.replace(/^0+/, '');
      // If all zeros were removed, keep it as empty
      if (cleanedValue === '') {
        setInputValue('');
        setCooldownDays(0);
        setValidationError('Please enter a value between 1 and 365.');
        return;
      }
    }
    
    // If single zero, show validation error
    if (cleanedValue === '0') {
      setInputValue('0');
      setCooldownDays(0);
      setValidationError('Please enter a value between 1 and 365.');
      return;
    }
    
    setInputValue(cleanedValue);
    const numValue = parseInt(cleanedValue, 10);
    const validation = validateValue(numValue);
    
    if (validation.isValid) {
      setCooldownDays(validation.numericValue);
      setValidationError(null);
    } else {
      setCooldownDays(validation.numericValue);
      setValidationError(validation.error);
    }
  };

  const handleInputBlur = () => {
    // Auto-correct on blur: remove leading zeros and validate
    if (inputValue === '' || inputValue === '0') {
      setInputValue('7');
      setCooldownDays(7);
      setValidationError(null);
      toast.showInfo('Value set to default: 7 days.');
      return;
    }
    
    // Remove any remaining leading zeros
    let cleanedValue = inputValue.replace(/^0+/, '');
    if (cleanedValue === '') {
      cleanedValue = '7';
      setCooldownDays(7);
      setValidationError(null);
      toast.showInfo('Value set to default: 7 days.');
    } else {
      const numValue = parseInt(cleanedValue, 10);
      const validation = validateValue(numValue);
      
      if (validation.isValid) {
        setCooldownDays(validation.numericValue);
        setInputValue(cleanedValue);
        setValidationError(null);
      } else {
        // If out of range, clamp to valid range
        if (numValue < 1) {
          setCooldownDays(1);
          setInputValue('1');
          setValidationError(null);
          toast.showInfo('Value adjusted to minimum: 1 day.');
        } else if (numValue > 365) {
          setCooldownDays(365);
          setInputValue('365');
          setValidationError(null);
          toast.showInfo('Value adjusted to maximum: 365 days.');
        } else {
          setValidationError(validation.error);
        }
      }
    }
  };

  const handleSave = async () => {
    if (!context) return;
    
    if (cooldownDays < 1 || cooldownDays > 365) {
      toast.showWarning('Cooldown period must be between 1 and 365 days.');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/cooldown-config?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: cooldownDays }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to save cooldown configuration');
      }
      
      const data = await res.json();
      if (data.error) {
        throw new Error(data.message || 'Failed to save cooldown configuration');
      }
      
      setOriginalDays(cooldownDays);
      setInputValue(cooldownDays.toString());
      toast.showSuccess('Cooldown period updated successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save cooldown configuration';
      setError(message);
      toast.showError(message);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = cooldownDays !== originalDays;
  const isValid = cooldownDays >= 1 && cooldownDays <= 365 && validationError === null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cooling-off Period</h2>
          <p className="text-sm text-gray-500">Configure how long users must wait after rejection before resubmitting</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="cooldown-days" className="block text-sm font-medium text-gray-700 mb-2">
            Cooldown Period (days)
          </label>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <input
                id="cooldown-days"
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className={`w-32 px-3 py-2 border rounded-lg focus:ring-2 text-sm transition-colors ${
                  validationError
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50'
                    : isValid && inputValue !== ''
                    ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="7"
              />
              {validationError && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationError}
                </p>
              )}
            </div>
            <span className="text-sm text-gray-600">
              Users must wait this many days after rejection before they can resubmit
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Range: 1-365 days. Default: 7 days.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || !isValid}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              hasChanges && !saving && isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CooldownConfig;

