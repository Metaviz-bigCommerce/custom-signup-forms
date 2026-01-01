'use client'

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { getUserFriendlyError } from '@/lib/utils';

export interface RequestInfoModalProps {
  isOpen: boolean;
  requestId: string | null;
  context: string;
  onClose: () => void;
  onSent?: (id: string) => void;
  showToast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
  };
}

const RequestInfoModal: React.FC<RequestInfoModalProps> = ({
  isOpen,
  requestId,
  context,
  onClose,
  onSent,
  showToast,
}) => {
  const [requestInfoText, setRequestInfoText] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen || !requestId) return null;

  const handleClose = () => {
    setRequestInfoText('');
    onClose();
  };

  const handleSend = async () => {
    if (!context || !requestId || !requestInfoText.trim()) {
      showToast.warning('Please enter the information you need from the user.');
      return;
    }
    
    setSending(true);
    try {
      const res = await fetch(
        `/api/signup-requests/info-request?id=${encodeURIComponent(requestId)}&context=${encodeURIComponent(context)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ required_information: requestInfoText.trim() }),
        }
      );
      
      if (res.ok) {
        // Close modals first, then show success toast
        setRequestInfoText('');
        onSent?.(requestId);
        onClose();
        // Use setTimeout to ensure modals close before toast is shown
        setTimeout(() => {
          showToast.success('Info request email sent (if email configured).');
        }, 100);
      } else {
        const errorText = await res.text();
        // Keep modal open on failure and show error toast
        showToast.error(getUserFriendlyError(errorText, 'Unable to send the information request. Please try again.'));
      }
    } catch (error: unknown) {
      showToast.error(getUserFriendlyError(error, 'Unable to send the information request. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-3 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 border-b border-gray-100">
          <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Request Information from User</div>
          <div className="text-[11px] sm:text-xs md:text-sm text-gray-600 mt-0.5 sm:mt-1 leading-relaxed">
            Enter the information you need from the user. An email will be sent if email is configured.
          </div>
        </div>

        {/* Body */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex-1 overflow-y-auto">
          <label className="block text-[11px] sm:text-xs md:text-sm font-medium text-gray-800 mb-1.5 sm:mb-2">
            Required Information
          </label>
          <textarea
            value={requestInfoText}
            onChange={(e) => setRequestInfoText(e.target.value)}
            placeholder="e.g., Please provide additional documentation for verification..."
            className="w-full px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            rows={4}
            autoFocus
            disabled={sending}
          />
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
            disabled={sending || !requestInfoText.trim()}
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
                <span>Send Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestInfoModal;
