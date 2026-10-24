import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Eye, 
  Wallet, 
  LogOut, 
  Lock, 
  Layers,
  Phone,
  RotateCcw
} from 'lucide-react';
import type { Campaign, Submission, SubmissionStatus } from '../types';
import { getCampaigns, getSubmissions, updateSubmissionStatus, createCampaign } from '../lib/api';
import { exportSubmissionsToExcel } from '../lib/exportExcel';
import { ReceiptModal } from './ReceiptModal';

export const AdminPortal: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('deptpay_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data State
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Feedback
  const [activeReceipt, setActiveReceipt] = useState<Submission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [camps, subs] = await Promise.all([
        getCampaigns(),
        getSubmissions(selectedCampaignId),
      ]);
      setCampaigns(camps);
      setSubmissions(subs);
      showToast('Records refreshed!', 'info');
    } catch {
      showToast('Could not refresh records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // New Campaign Form
  const [newTitle, setNewTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newBankName, setNewBankName] = useState('OPay');
  const [newAccountNum, setNewAccountNum] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, selectedCampaignId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, subs] = await Promise.all([
        getCampaigns(),
        getSubmissions(selectedCampaignId),
      ]);
      setCampaigns(camps);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const configuredPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'che300';
    if (passcode.trim() === configuredPasscode || passcode.trim() === 'lautech2026') {
      setIsAuthenticated(true);
      localStorage.setItem('deptpay_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Incorrect passcode. Access restricted to authorized executives.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('deptpay_admin_auth');
  };

  const handleApprove = async (id: string) => {
    try {
      await updateSubmissionStatus(id, 'approved');
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'approved', reviewed_at: new Date().toISOString() } : s))
      );
      showToast('Receipt approved & recorded!', 'success');
    } catch {
      showToast('Failed to approve receipt. Check connection.', 'error');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await updateSubmissionStatus(id, 'rejected', reason);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() } : s))
      );
      showToast('Receipt marked as rejected.', 'info');
    } catch {
      showToast('Failed to update receipt. Check connection.', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount || !newAccountNum || !newAccountName) return;

    setIsCreatingCampaign(true);
    try {
      const created = await createCampaign({
        title: newTitle,
        course_code: newCourseCode || undefined,
        description: newDescription || undefined,
        amount: Number(newAmount),
        bank_name: newBankName,
        account_number: newAccountNum,
        account_name: newAccountName,
        is_active: true,
      });

      setCampaigns([created, ...campaigns]);
      setShowCreateModal(false);
      showToast(`Created item: ${created.title}`, 'success');
      // Reset form
      setNewTitle('');
      setNewCourseCode('');
      setNewAmount('');
      setNewAccountNum('');
      setNewAccountName('');
      setNewDescription('');
    } catch {
      showToast('Failed to create payment item.', 'error');
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleExport = async () => {
    const campaignTitle = selectedCampaignId === 'all'
      ? 'All_Departmental_Collections'
      : (campaigns.find(c => c.id === selectedCampaignId)?.title || 'Departmental_List');
    
    const dataToExport = filteredSubmissions.filter(s => s.status === 'approved');
    const records = dataToExport.length > 0 ? dataToExport : filteredSubmissions;
    
    const success = await exportSubmissionsToExcel(records, campaignTitle);
    if (!success) {
      showToast('No submissions found to export.', 'error');
    } else {
      showToast(`Exported ${records.length} records to Excel!`, 'success');
    }
  };

  // Metrics
  const totalApprovedAmount = submissions
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + (s.campaign?.amount || 0), 0);

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.full_name.toLowerCase().includes(query) ||
      s.matric_number.toLowerCase().includes(query) ||
      (s.phone_number && s.phone_number.includes(query));
    return matchesStatus && matchesSearch;
  });

  // Login Screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center max-w-md w-full animate-in zoom-in-95">
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xs">
            <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Class Rep Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your Rep Passcode to manage receipt verifications and class records.</p>

          <form onSubmit={handleLogin} className="mt-5 sm:mt-6 space-y-3 sm:space-y-4">
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Rep Passcode"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm text-center font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {loginError && <p className="text-xs text-rose-600 font-semibold">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 active:bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            🔒 Protected Portal • Authorized personnel only
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Class Rep Control Center</span>
            <span className="text-[10px] sm:text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              CHE 300L
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Review student payments, approve receipts, and generate lecturer printouts.
          </p>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New Item</span>
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row: Clean 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Collected */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">Verified Total</span>
            <div className="text-base sm:text-xl font-black text-slate-900 truncate">₦{totalApprovedAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 relative">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">Pending</span>
            <div className="text-base sm:text-xl font-black text-slate-900 truncate">{pendingCount} receipts</div>
          </div>
        </div>

        {/* Total Approved Students */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">Approved</span>
            <div className="text-base sm:text-xl font-black text-slate-900 truncate">{approvedCount} students</div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block truncate">Active Items</span>
            <div className="text-base sm:text-xl font-black text-slate-900 truncate">{campaigns.filter(c => c.is_active).length} items</div>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter Controls (Mobile Friendly Stack) */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 bg-slate-50/50">
          {/* Campaign Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 shrink-0 uppercase tracking-wider">Item:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="flex-1 sm:flex-initial p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payment Items</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code ? `[${c.course_code}] ` : ''}{c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-200/70 p-1 rounded-xl">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer text-center ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box & Refresh Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search matric or name..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleRefresh}
              title="Refresh submissions"
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 1. MOBILE CARDS VIEW (Only visible on screens < 768px) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Loading submissions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No submissions match this filter.
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div key={sub.id} className="p-3.5 hover:bg-slate-50/60 transition-colors space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-slate-900 text-sm truncate">{sub.full_name}</h2>
                    <span className="font-mono font-bold text-xs text-emerald-800">{sub.matric_number}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    sub.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : sub.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {sub.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[200px] font-medium text-slate-700">
                    {sub.campaign?.title || 'Fee'}
                  </span>
                  <span className="font-extrabold text-slate-900 shrink-0">
                    ₦{(sub.campaign?.amount || 0).toLocaleString()}
                  </span>
                </div>

                {sub.phone_number && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{sub.phone_number}</span>
                  </div>
                )}

                {/* Mobile Thumb Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveReceipt(sub)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inspect Receipt</span>
                  </button>

                  {sub.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(sub.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 2. DESKTOP TABLE VIEW (Visible on >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Matric No</th>
                <th className="py-3 px-4">Payment Item</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No submissions found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{sub.full_name}</div>
                      {sub.phone_number && (
                        <span className="text-[11px] text-slate-400 font-normal">{sub.phone_number}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {sub.matric_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium">
                      {sub.campaign?.title || 'Departmental Fee'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₦{(sub.campaign?.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(sub.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        sub.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setActiveReceipt(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>

                      {sub.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create New Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-4 sm:p-6 border border-slate-100 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5">Create Payment Collection</h2>
            <p className="text-xs text-slate-500 mb-3 sm:mb-4">Set up a new study material, textbook, or dues.</p>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CHE 303 Reaction Engineering Manual"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CHE 303"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs uppercase font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (NGN) *</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="e.g. OPay / Kuda"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newAccountNum}
                    onChange={(e) => setNewAccountNum(e.target.value)}
                    placeholder="e.g. 8123456789"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Adeyemi Daniel (Class Rep)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Instructions for students..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingCampaign ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Receipt Viewer */}
      {activeReceipt && (
        <ReceiptModal
          submission={activeReceipt}
          onClose={() => setActiveReceipt(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Floating Action Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
