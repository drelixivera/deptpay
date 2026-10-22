import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ExternalLink, Calendar, Phone, CreditCard, AlertTriangle } from 'lucide-react';
import type { Submission } from '../types';

interface ReceiptModalProps {
  submission: Submission | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  submission,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('Amount on receipt does not match required fee');
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!submission) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove(submission.id);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    const finalReason = reason === 'other' ? customReason : reason;
    try {
      await onReject(submission.id, finalReason);
      setRejecting(false);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Receipt Image Preview */}
        <div className="md:w-3/5 bg-slate-950 flex flex-col items-center justify-center p-4 relative min-h-[300px] md:min-h-[500px]">
          <img
            src={submission.receipt_url}
            alt="Payment Receipt"
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
          <div className="absolute top-3 left-3">
            <a
              href={submission.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open full size
            </a>
          </div>
        </div>

        {/* Right: Submission Details & Actions */}
        <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto bg-white">
          <div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  submission.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : submission.status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {submission.status}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{submission.full_name}</h3>
                <p className="text-sm font-mono text-emerald-700 font-semibold">{submission.matric_number}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Details */}
            <div className="py-4 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600">
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-medium text-slate-900">{submission.campaign?.title || 'Payment Item'}</div>
                  <div className="text-xs text-slate-500">Required: ₦{(submission.campaign?.amount || 0).toLocaleString()}</div>
                </div>
              </div>

              {submission.phone_number && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <a href={`https://wa.me/234${submission.phone_number.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
                    {submission.phone_number} (Message on WhatsApp)
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500">
                  Submitted: {new Date(submission.created_at).toLocaleString('en-GB')}
                </span>
              </div>

              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason:
                  </div>
                  {submission.rejection_reason}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100">
            {rejecting ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Reason for Rejection:</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="Amount on receipt does not match required fee">Amount on receipt does not match required fee</option>
                  <option value="Screenshot is blurry or unreadable">Screenshot is blurry or unreadable</option>
                  <option value="Sender name or reference cannot be verified">Sender name or reference cannot be verified</option>
                  <option value="Duplicate receipt or recycled transaction">Duplicate receipt or recycled transaction</option>
                  <option value="other">Other reason (Type below)</option>
                </select>

                {reason === 'other' && (
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter detailed reason for the student..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setRejecting(false)}
                    className="w-1/2 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-1/2 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setRejecting(true)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100/70 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || submission.status === 'approved'}
                  className="flex-1 py-2.5 px-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submission.status === 'approved' ? 'Approved' : 'Approve Receipt'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
