'use client'

import React, { useState } from 'react';
import { Mail } from 'lucide-react';

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
        showToast.success('Info request email sent (if email configured).');
        setRequestInfoText('');
        onSent?.(requestId);
        onClose();
      } else {
        const errorText = await res.text();
        showToast.error('Failed to send info request: ' + errorText);
      }
    } catch (error: unknown) {
      showToast.error('Failed to send info request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">Request Information from User</div>
          <div className="text-sm text-gray-600 mt-1">
            Enter the information you need from the user. An email will be sent if email is configured.
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Required Information
          </label>
          <textarea
            value={requestInfoText}
            onChange={(e) => setRequestInfoText(e.target.value)}
            placeholder="e.g., Please provide additional documentation for verification..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            rows={4}
            autoFocus
            disabled={sending}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !requestInfoText.trim()}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestInfoModal;
