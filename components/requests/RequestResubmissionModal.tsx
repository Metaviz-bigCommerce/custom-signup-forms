'use client'

import React, { useState, useMemo } from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/utils';
import { useStoreForm } from '@/lib/hooks';
import { FormField } from '@/components/FormBuilder/types';

export interface RequestResubmissionModalProps {
  isOpen: boolean;
  requestId: string | null;
  requestData?: Record<string, unknown>; // The actual data from the request
  context: string;
  onClose: () => void;
  onSent?: (id: string) => void;
  showToast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const RequestResubmissionModal: React.FC<RequestResubmissionModalProps> = ({
  isOpen,
  requestId,
  requestData,
  context,
  onClose,
  onSent,
  showToast,
}) => {
  const { form } = useStoreForm();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Get form fields from the form definition
  const formFields: FormField[] = useMemo(() => {
    return (form?.fields as FormField[]) || [];
  }, [form]);

  // Helper to normalize strings for comparison
  const normalizeKey = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Helper to match request data key to form field label
  const matchKeyToField = (key: string): FormField | null => {
    const normalizedKey = normalizeKey(key);
    for (const field of formFields) {
      const normalizedLabel = normalizeKey(field.label);
      if (
        field.label.toLowerCase() === key.toLowerCase() ||
        normalizedLabel === normalizedKey ||
        key.toLowerCase().includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedKey)
      ) {
        return field;
      }
      // Also check by role
      if (field.role === 'first_name' && /first[\s_-]?name/i.test(key)) return field;
      if (field.role === 'last_name' && /last[\s_-]?name/i.test(key)) return field;
      if (field.role === 'email' && /email/i.test(key)) return field;
      if (field.role === 'country' && /country/i.test(key)) return field;
      if (field.role === 'state' && /state|province/i.test(key)) return field;
    }
    return null;
  };

  // Sort fields according to form field order, with first name, last name, email first
  const getFieldSortOrder = (key: string): number => {
    // Priority order: first_name (0), last_name (1), email (2), then by form field order
    const lowerKey = key.toLowerCase();
    if (/first[\s_-]?name/i.test(lowerKey)) return 0;
    if (/last[\s_-]?name/i.test(lowerKey)) return 1;
    if (/^email$/i.test(lowerKey)) return 2;
    
    // Find the field in formFields array
    const field = matchKeyToField(key);
    if (field) {
      // Return index + 100 to place after priority fields
      const index = formFields.indexOf(field);
      return index >= 0 ? index + 100 : 999;
    }
    return 999;
  };

  // Get field labels for checkbox list - only show fields that exist in the request data
  const availableFields = useMemo(() => {
    if (!requestData || Object.keys(requestData).length === 0) {
      return [];
    }

    // Get all keys from request data (excluding password fields)
    const requestKeys = Object.keys(requestData).filter(key => {
      const lowerKey = key.toLowerCase();
      return !/password/i.test(lowerKey);
    });

    // Match each request key to a form field and get its label
    const matchedFields = new Map<string, { label: string; originalKey: string; sortOrder: number }>();
    
    for (const requestKey of requestKeys) {
      const matchedField = matchKeyToField(requestKey);
      if (matchedField && matchedField.label && matchedField.label.trim() && matchedField.type !== 'file') {
        // Use the form field label as the key (this is what we'll send to the API)
        const sortOrder = getFieldSortOrder(requestKey);
        matchedFields.set(matchedField.label, {
          label: matchedField.label,
          originalKey: requestKey,
          sortOrder,
        });
      } else {
        // If no match found, use the request key itself as a fallback
        // Format it nicely for display
        const formattedKey = requestKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        const sortOrder = getFieldSortOrder(requestKey);
        matchedFields.set(formattedKey, {
          label: formattedKey,
          originalKey: requestKey,
          sortOrder,
        });
      }
    }

    // Convert to array and sort by sortOrder (same as RequestDetailsModal)
    return Array.from(matchedFields.entries())
      .map(([label, data]) => ({
        key: label, // Use label as key for selection
        label: data.label,
        originalKey: data.originalKey, // Keep original key for reference
        sortOrder: data.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [requestData, formFields]);

  if (!isOpen || !requestId) return null;

  const handleClose = () => {
    setSelectedFields([]);
    setMessage('');
    onClose();
  };

  const handleToggleField = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSend = async () => {
    if (!context || !requestId) {
      showToast.warning('Missing required information.');
      return;
    }

    if (selectedFields.length === 0) {
      showToast.warning('Please select at least one field that needs correction.');
      return;
    }
    
    setSending(true);
    try {
      const res = await fetch(
        `/api/signup-requests/resubmission-request?id=${encodeURIComponent(requestId)}&context=${encodeURIComponent(context)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            problematicFields: selectedFields,
            message: message.trim() || undefined,
          }),
        }
      );
      
      if (res.ok) {
        // Close modals first, then show success toast
        setSelectedFields([]);
        setMessage('');
        onSent?.(requestId);
        onClose();
        // Use setTimeout to ensure modals close before toast is shown
        setTimeout(() => {
          showToast.success('Resubmission request sent.');
        }, 100);
      } else {
        const errorText = await res.text();
        // Keep modal open on failure and show error toast
        showToast.error(getUserFriendlyError(errorText, 'Unable to send the resubmission request. Please try again.'));
      }
    } catch (error: unknown) {
      showToast.error(getUserFriendlyError(error, 'Unable to send the resubmission request. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100">
          <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Request Resubmission</div>
          <div className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-relaxed">
            Select the fields that need correction. An email will be sent to the user asking them to resubmit.
          </div>
        </div>

        {/* Body */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex-1 overflow-y-auto">
          {/* Warning */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-amber-800">
              The request status will be updated to &quot;Resubmission Requested&quot;. When the user resubmits, the old request will be deleted and a new request will be created.
            </div>
          </div>

          {/* Field Selection */}
          <div className="mb-4">
            <label className="block text-[11px] sm:text-xs md:text-sm font-medium text-gray-800 mb-2">
              Select Fields That Need Correction <span className="text-red-500">*</span>
            </label>
            {availableFields.length === 0 ? (
              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
                No form fields available. Please configure your form first.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5">
                {availableFields.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => handleToggleField(field.key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      disabled={sending}
                    />
                    <span className="text-xs sm:text-sm text-gray-700 flex-1">{field.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-[11px] sm:text-xs md:text-sm font-medium text-gray-800 mb-1.5 sm:mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any additional instructions or context for the user..."
              className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              rows={3}
              disabled={sending}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-3">
          <button
            onClick={handleClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors text-xs sm:text-sm cursor-pointer"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedFields.length === 0}
            className="flex-1 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            {sending ? (
              <>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Send Resubmission Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestResubmissionModal;
