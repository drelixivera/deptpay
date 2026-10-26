import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ExternalLink, Calendar, Phone, CreditCard, AlertTriangle, Info } from 'lucide-react';
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

  // Check if this was automatically replaced by the system
  const isSystemReplaced = submission.rejection_reason === 'Replaced by a new upload from the student.';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col md:flex-row overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left / Top: Receipt Image Preview */}
        <div className="md:w-3/5 bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 relative h-52 sm:h-72 md:h-auto md:min-h-[480px] shrink-0">
          <img
            src={submission.receipt_url}
            alt="Payment Receipt"
            className="h-full w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
          <div className="absolute top-3 left-3">
            <a
              href={submission.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs bg-slate-800/90 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open full size
            </a>
          </div>

          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 text-slate-300 hover:text-white bg-slate-800/80 p-1.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Right / Bottom: Submission Details & Actions */}
        <div className="md:w-2/5 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-white flex-1">
          <div>
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="min-w-0 pr-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                  submission.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : submission.status === 'rejected'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {submission.status}
                </span>
                <h3 className="text-base sm:text-xl font-bold text-slate-900 mt-1 truncate">{submission.full_name}</h3>
                <p className="text-xs sm:text-sm font-mono text-emerald-700 font-extrabold">{submission.matric_number}</p>
              </div>
              <button
                onClick={onClose}
                className="hidden md:block text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Item Details */}
            <div className="py-3 sm:py-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 text-slate-600">
                <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 leading-snug">{submission.campaign?.title || 'Payment Item'}</div>
                  <div className="text-[11px] text-slate-500 font-semibold">Fee: ₦{(submission.campaign?.amount || 0).toLocaleString()}</div>
                </div>
              </div>

              {submission.phone_number && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <a 
                    href={`https://wa.me/234${submission.phone_number.replace(/^0/, '')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-emerald-700 hover:underline font-bold text-xs"
                  >
                    {submission.phone_number} (Chat on WhatsApp)
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-500">
                  {new Date(submission.created_at).toLocaleString('en-GB')}
                </span>
              </div>

              {submission.status === 'rejected' && submission.rejection_reason && (
                <div className={`p-2.5 border rounded-xl text-xs ${
                  isSystemReplaced 
                    ? 'bg-slate-50 border-slate-200 text-slate-600' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    {isSystemReplaced ? <Info className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} 
                    {isSystemReplaced ? 'System Note:' : 'Rejection Reason:'}
                  </div>
                  {submission.rejection_reason}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Thumb-Friendly */}
          <div className="pt-3 border-t border-slate-100">
            {/* If the system replaced this, hide all action buttons */}
            {isSystemReplaced ? (
              <div className="p-3 bg-slate-100 rounded-xl text-center">
                <p className="text-xs font-bold text-slate-500">This receipt was replaced by a newer upload.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Review the newer pending submission instead.</p>
              </div>
            ) : rejecting ? (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">Reason for Rejection:</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-base sm:text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
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
                    className="w-full text-base sm:text-xs p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setRejecting(false)}
                    className="w-1/2 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
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
                  className="flex-1 py-3 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || submission.status === 'approved'}
                  className="flex-1 py-3 px-3 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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