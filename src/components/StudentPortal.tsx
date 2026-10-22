import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Check, 
  Copy, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building2, 
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Campaign, Submission } from '../types';
import { getCampaigns, submitReceipt, getSubmissionsByMatric } from '../lib/api';

export const StudentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'status'>('submit');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [fullName, setFullName] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState<Submission | null>(null);

  // Status Tracker State
  const [searchMatric, setSearchMatric] = useState('');
  const [searchedSubmissions, setSearchedSubmissions] = useState<Submission[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await getCampaigns();
      const active = data.filter(c => c.is_active);
      setCampaigns(active);
      if (active.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(active[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const handleCopyAccount = () => {
    if (!selectedCampaign) return;
    navigator.clipboard.writeText(selectedCampaign.account_number);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please upload an image file (PNG, JPG, or WEBP)');
        return;
      }
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCampaignId) {
      setErrorMsg('Please select a payment item.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name as it appears on your school records.');
      return;
    }
    if (!matricNumber.trim()) {
      setErrorMsg('Please enter your matriculation number (e.g. 20/4102).');
      return;
    }
    if (!receiptFile) {
      setErrorMsg('Please upload a screenshot or photo of your bank transfer receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitReceipt(
        selectedCampaignId,
        fullName,
        matricNumber,
        phoneNumber,
        receiptFile
      );

      setSubmittedSuccess(result);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Clear form
      setFullName('');
      setMatricNumber('');
      setPhoneNumber('');
      setReceiptFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Submission failed. Please check your internet connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMatric.trim()) return;

    setIsSearching(true);
    setSearchError('');
    try {
      const results = await getSubmissionsByMatric(searchMatric.trim());
      setSearchedSubmissions(results);
    } catch (err: unknown) {
      console.error(err);
      setSearchError('Could not retrieve status. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Subheader / Tabs */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Chemical Engineering Departmental Payments
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Make your bank transfer directly, upload your receipt here, and get verified without sending WhatsApp DMs.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl mt-6 shadow-inner">
          <button
            onClick={() => { setActiveTab('submit'); setSubmittedSuccess(null); }}
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'submit'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submit Payment Receipt
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            Check My Status
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMIT RECEIPT */}
      {activeTab === 'submit' && (
        <>
          {submittedSuccess ? (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl p-8 text-center max-w-lg mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Receipt Submitted!</h2>
              <p className="text-sm text-slate-600 mt-2">
                Your receipt for <span className="font-semibold text-slate-800">{submittedSuccess.full_name}</span> has been logged into the system.
              </p>

              <div className="my-6 p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Matric Number:</span>
                  <span className="font-mono font-bold text-slate-800">{submittedSuccess.matric_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    🟡 Pending Verification
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submission Time:</span>
                  <span className="text-slate-700">{new Date(submittedSuccess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSearchMatric(submittedSuccess.matric_number);
                    setActiveTab('status');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer"
                >
                  Track Approval Status
                </button>
                <button
                  onClick={() => setSubmittedSuccess(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left Column: Bank & Campaign Information (2 cols) */}
              <div className="md:col-span-2 space-y-4">
                {/* Campaign Selection */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Payment Item
                  </label>
                  {loading ? (
                    <div className="animate-pulse h-10 bg-slate-100 rounded-lg"></div>
                  ) : (
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.course_code ? `[${c.course_code}] ` : ''}{c.title} (₦{c.amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCampaign?.description && (
                    <p className="text-xs text-slate-500 mt-2">
                      {selectedCampaign.description}
                    </p>
                  )}
                </div>

                {/* Bank Account Details Card */}
                {selectedCampaign && (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Bank Transfer Details</span>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                        ₦{selectedCampaign.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-medium">Bank Name</span>
                        <div className="text-base font-bold text-emerald-300">{selectedCampaign.bank_name}</div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-medium">Account Number</span>
                        <div className="flex items-center justify-between bg-slate-950/60 rounded-xl p-2.5 mt-0.5 border border-slate-700/50">
                          <span className="font-mono text-lg font-bold tracking-wider text-white">
                            {selectedCampaign.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer"
                          >
                            {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedBank ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 uppercase font-medium">Account Name</span>
                        <div className="text-sm font-semibold text-slate-200">{selectedCampaign.account_name}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Send the exact amount before uploading your receipt below.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Submission Form (3 cols) */}
              <div className="md:col-span-3">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h2 className="text-base font-bold text-slate-900">2. Student & Receipt Information</h2>
                    <span className="text-xs text-slate-400">Step 2 of 2</span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Adeyemi Daniel Babatunde"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Use the same surname and first name on your departmental list.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Matriculation Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={matricNumber}
                        onChange={(e) => setMatricNumber(e.target.value)}
                        placeholder="e.g. 20/4102"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        WhatsApp Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 08012345678"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Receipt Upload Dropzone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Upload Bank Transfer Receipt <span className="text-rose-500">*</span>
                    </label>
                    
                    {previewUrl ? (
                      <div className="relative border-2 border-emerald-400 bg-emerald-50/20 rounded-xl p-3 flex items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Receipt preview"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{receiptFile?.name}</p>
                          <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                            <Sparkles className="w-3 h-3" /> Image auto-compressed for quick upload
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setReceiptFile(null); setPreviewUrl(null); }}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 bg-white rounded-lg border border-rose-200 hover:bg-rose-50 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">Click or tap to upload receipt</span>
                        <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, or screenshot from your bank app</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying & Uploading Receipt...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Receipt to Class Rep</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CHECK MY STATUS */}
      {activeTab === 'status' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-2">Check Your Payment Verification Status</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter your matriculation number to see whether your receipts have been approved by the Class Rep.
            </p>

            <form onSubmit={handleSearchStatus} className="flex gap-2">
              <input
                type="text"
                required
                value={searchMatric}
                onChange={(e) => setSearchMatric(e.target.value)}
                placeholder="e.g. 20/4102"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSearching ? 'Searching...' : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </form>
            {searchError && <p className="text-xs text-rose-600 mt-2">{searchError}</p>}
          </div>

          {searchedSubmissions && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                Found {searchedSubmissions.length} record(s) for &quot;{searchMatric}&quot;
              </h3>

              {searchedSubmissions.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  No payment receipts found for this matric number yet.
                  <div className="mt-3">
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                    >
                      Submit a receipt now &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                searchedSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {sub.campaign?.title || 'Departmental Fee'}
                        </span>
                        {sub.campaign?.course_code && (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                            {sub.campaign.course_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Name on Record: <span className="font-semibold text-slate-700">{sub.full_name}</span> • Submitted: {new Date(sub.created_at).toLocaleDateString('en-GB')}
                      </p>

                      {sub.status === 'rejected' && sub.rejection_reason && (
                        <div className="mt-2 text-xs p-2.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                          <span className="font-semibold">Class Rep note:</span> {sub.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {sub.status === 'approved' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Approved & Recorded</span>
                        </div>
                      )}
                      {sub.status === 'pending' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Pending Verification</span>
                        </div>
                      )}
                      {sub.status === 'rejected' && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Action Required</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCampaignId(sub.campaign_id);
                              setActiveTab('submit');
                            }}
                            className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                          >
                            Re-upload receipt &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
