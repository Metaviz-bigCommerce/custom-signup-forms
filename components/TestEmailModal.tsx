'use client'

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { isValidEmail, getUserFriendlyError } from '@/lib/utils';

export interface TestEmailModalProps {
  isOpen: boolean;
  templateKey: string;
  context: string;
  onClose: () => void;
  onSent?: () => void;
  showToast: {
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    showWarning: (msg: string) => void;
  };
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({
  isOpen,
  templateKey,
  context,
  onClose,
  onSent,
  showToast,
}) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setEmailError('');
    onClose();
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email address is required');
      return false;
    }
    if (!isValidEmail(value.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handleSend = async () => {
    const trimmedEmail = email.trim();
    
    if (!validateEmail(trimmedEmail)) {
      return;
    }
    
    if (!context || !templateKey) {
      showToast.showError('Missing required information');
      return;
    }
    
    setSending(true);
    try {
      const res = await fetch(
        `/api/email/test?context=${encodeURIComponent(context)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: trimmedEmail, key: templateKey }),
        }
      );
      
      if (res.ok) {
        showToast.showSuccess('Test email sent! Check your inbox.');
        setEmail('');
        onSent?.();
        onClose();
      } else {
        const errorText = await res.text();
        showToast.showError(getUserFriendlyError(errorText, 'Unable to send the test email. Please check your email configuration and try again.'));
      }
    } catch (error: unknown) {
      showToast.showError(getUserFriendlyError(error, 'Unable to send the test email. Please check your email configuration and try again.'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending && email.trim() && !emailError) {
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="text-base sm:text-lg font-bold text-gray-900">Send Test Email</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">
            Enter an email address to send a test email with the current template.
          </div>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 flex-shrink-0 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => validateEmail(email)}
            onKeyDown={handleKeyDown}
            placeholder="example@email.com"
            className={`w-full px-4 py-3 border rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
              emailError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            autoFocus
            disabled={sending}
          />
          {emailError && (
            <p className="mt-2 text-sm text-red-600">{emailError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-sm font-medium w-full sm:w-auto"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !email.trim() || !!emailError}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 flex-shrink-0" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestEmailModal;

