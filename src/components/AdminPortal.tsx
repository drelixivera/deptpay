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
  Layers 
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

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<Submission | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    // Default passcodes for easy class rep access
    if (passcode === 'che300' || passcode === 'lautech2026' || passcode === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('deptpay_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Incorrect passcode. (Hint: che300)');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('deptpay_admin_auth');
  };

  const handleApprove = async (id: string) => {
    await updateSubmissionStatus(id, 'approved');
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved', reviewed_at: new Date().toISOString() } : s))
    );
  };

  const handleReject = async (id: string, reason: string) => {
    await updateSubmissionStatus(id, 'rejected', reason);
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() } : s))
    );
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
      // Reset form
      setNewTitle('');
      setNewCourseCode('');
      setNewAmount('');
      setNewAccountNum('');
      setNewAccountName('');
      setNewDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleExport = () => {
    const campaignTitle = selectedCampaignId === 'all'
      ? 'All_Departmental_Collections'
      : (campaigns.find(c => c.id === selectedCampaignId)?.title || 'Departmental_List');
    
    // Export approved or all filtered
    const dataToExport = filteredSubmissions.filter(s => s.status === 'approved');
    exportSubmissionsToExcel(dataToExport.length > 0 ? dataToExport : filteredSubmissions, campaignTitle);
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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Class Rep Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Enter your Rep Passcode to manage receipt verifications and class records.</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Rep Passcode (e.g. che300)"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {loginError && <p className="text-xs text-rose-600 font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Default passcodes: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">che300</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">lautech2026</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Class Rep Control Center</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              CHE 300L
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review student payments, approve receipts, and generate lecturer printouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Payment Item</span>
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export to Excel</span>
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Verified</span>
            <div className="text-xl font-black text-slate-900">₦{totalApprovedAmount.toLocaleString()}</div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 relative">
            <Clock className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="text-xl font-black text-slate-900">{pendingCount} receipts</div>
          </div>
        </div>

        {/* Total Approved Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Students</span>
            <div className="text-xl font-black text-slate-900">{approvedCount} records</div>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Items</span>
            <div className="text-xl font-black text-slate-900">{campaigns.filter(c => c.is_active).length} campaigns</div>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Campaign Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0 uppercase tracking-wider">Item:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl self-start md:self-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matric or name..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {sub.campaign?.title || 'Departmental Fee'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      ₦{(sub.campaign?.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(sub.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
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
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>

                      {sub.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create New Payment Collection</h2>
            <p className="text-xs text-slate-500 mb-4">Set up a new study material, textbook, or departmental fee.</p>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CHE 303 Reaction Engineering Manual"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CHE 303"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (NGN) *</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 3500"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="e.g. OPay / Kuda / GTBank"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    value={newAccountNum}
                    onChange={(e) => setNewAccountNum(e.target.value)}
                    placeholder="e.g. 8123456789"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. Adeyemi Daniel (Class Rep)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Instructions for students..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
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
    </div>
  );
};
