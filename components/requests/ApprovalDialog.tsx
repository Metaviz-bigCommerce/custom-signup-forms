'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CustomerGroup {
  id: number;
  name: string;
  is_default?: boolean;
}

export interface ApprovalDialogProps {
  isOpen: boolean;
  requestId: string | null;
  context: string;
  onClose: () => void;
  onApproved: (id: string) => void;
  showToast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  requestId,
  context,
  onClose,
  onApproved,
  showToast,
}) => {
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchCustomerGroups = useCallback(async () => {
    if (!context) return;
    setGroupsLoading(true);
    setSelectedGroupId(null);
    try {
      const res = await fetch(`/api/customer-groups?context=${encodeURIComponent(context)}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setCustomerGroups(Array.isArray(json?.groups) ? json.groups : []);
    } catch {
      setCustomerGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchCustomerGroups();
    }
  }, [isOpen, requestId, fetchCustomerGroups]);

  const handleApprove = async () => {
    if (!context || !requestId) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/signup-requests/approve?context=${encodeURIComponent(context)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, customer_group_id: selectedGroupId || undefined }),
      });
      if (!res.ok) {
        const txt = await res.text();
        showToast.error(txt || 'Failed to approve and create customer');
        return;
      }
      showToast.success('Request approved and customer created successfully.');
      onApproved(requestId);
      onClose();
    } catch (error) {
      showToast.error('Failed to approve: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setApproving(false);
    }
  };

  const handleClose = () => {
    if (!approving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-bold text-gray-900">Approve request</div>
          <div className="text-sm text-gray-600 mt-1">
            Create a BigCommerce customer. Optionally assign a customer group.
          </div>
        </div>
        <div className="px-6 py-5">
          {groupsLoading ? (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Loading customer groups…
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-gray-800 mb-2">Customer group</div>
              <div className="space-y-2 max-h-64 overflow-auto border border-gray-200 rounded-md p-3">
                <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors">
                  <input
                    type="radio"
                    name="customer_group"
                    checked={selectedGroupId === null}
                    onChange={() => setSelectedGroupId(null)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Do not assign a group</span>
                </label>
                {customerGroups.map((g) => (
                  <label 
                    key={g.id} 
                    className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition-colors"
                  >
                    <input
                      type="radio"
                      name="customer_group"
                      checked={selectedGroupId === Number(g.id)}
                      onChange={() => setSelectedGroupId(Number(g.id))}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex-1">
                      <span className="font-medium text-gray-900">{g.name || `Group #${g.id}`}</span>
                      {g.is_default && (
                        <span className="ml-2 text-xs text-gray-500">(default)</span>
                      )}
                    </span>
                  </label>
                ))}
                {!customerGroups.length && (
                  <div className="text-sm text-gray-500 p-2">No customer groups found.</div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm cursor-pointer"
            disabled={approving}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex-1 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {approving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Approve and Create Customer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDialog;
