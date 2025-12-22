'use client'

import React from 'react';
import { Loader2, CheckCircle2, XCircle, Power, XCircle as DeactivateIcon } from 'lucide-react';

type OperationType = 'activate' | 'deactivate';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface FormOperationProgressModalProps {
  isOpen: boolean;
  operationType: OperationType;
  formName: string;
  steps: Step[];
  error?: string | null;
}

export default function FormOperationProgressModal({
  isOpen,
  operationType,
  formName,
  steps,
  error,
}: FormOperationProgressModalProps) {
  if (!isOpen) return null;

  const isActivating = operationType === 'activate';
  const iconColor = isActivating ? 'text-emerald-600' : 'text-rose-600';
  const bgGradient = isActivating 
    ? 'from-emerald-50 to-blue-50' 
    : 'from-rose-50 to-orange-50';
  
  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepTextColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700';
      case 'in-progress':
        return 'text-blue-700 font-medium';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-500';
    }
  };

  const allCompleted = steps.every(s => s.status === 'completed');
  const hasError = steps.some(s => s.status === 'error') || error;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 border-2 ${
          hasError ? 'border-red-200' : allCompleted ? 'border-emerald-200' : 'border-blue-200'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 bg-gradient-to-r ${bgGradient}`}>
          <div className="flex items-center gap-3">
            {isActivating ? (
              <Power className={`w-6 h-6 ${iconColor} animate-pulse`} />
            ) : (
              <DeactivateIcon className={`w-6 h-6 ${iconColor}`} />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {isActivating ? 'Activating Form' : 'Deactivating Form'}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">{formName}</p>
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="p-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getStepTextColor(step.status)}`}>
                    {step.label}
                  </p>
                  {step.status === 'in-progress' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Error occurred</p>
                  <p className="text-xs text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {allCompleted && !hasError && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-800">
                  {isActivating ? 'Form activated successfully!' : 'Form deactivated successfully!'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

