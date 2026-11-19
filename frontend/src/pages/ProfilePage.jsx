import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Check,
  Smartphone,
  Building,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

import DashBoardLayout from '../components/layout/DashBoardLayout';
import RequestPayoutModal from '../components/models/RequestPayoutModal';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';

const ProfilePage = () => {
  const { user, updateUser, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  });

  const [payoutSettings, setPayoutSettings] = useState({
    payoutMethod: 'upi',
    upiId: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  const [earningsData, setEarningsData] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
      });
      if (user.payoutSettings) {
        setPayoutSettings({
          payoutMethod: user.payoutSettings.payoutMethod || 'upi',
          upiId: user.payoutSettings.upiId || '',
          accountHolderName: user.payoutSettings.accountHolderName || '',
          accountNumber: user.payoutSettings.accountNumber || '',
          ifscCode: user.payoutSettings.ifscCode || '',
          bankName: user.payoutSettings.bankName || '',
        });
      }
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.PAYMENT.CREATOR_EARNINGS);
      setEarningsData(response.data?.data || null);
    } catch {
      // Silently ignore if no earnings yet
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePayoutChange = (e) => {
    setPayoutSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        name: formData.name,
        bio: formData.bio,
        payoutSettings,
      });

      updateUser(response.data.data ?? response.data);
      setSaveSuccess(true);
      toast.success('Profile and payout settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <DashBoardLayout activeMenu="profile">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Loading your profile...</p>
          </div>
        </div>
      </DashBoardLayout>
    );
  }

  return (
    <DashBoardLayout activeMenu="profile">
      <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Creator Account & Payout Setup
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal info, creator bio, and where your reader subscription revenue is
              transferred.
            </p>
          </div>

          {/* Creator Earnings & Payout Dashboard */}
          {earningsData && earningsData.totalEarnings > 0 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
                      Creator Revenue & Payout Hub
                    </span>
                    <span className="text-sm font-medium text-emerald-50">
                      {earningsData.activeSubscribersCount || 0} active reader subscriptions
                    </span>
                  </div>

                  {earningsData.availableBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPayoutModalOpen(true)}
                      className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Withdraw Gateway Balance (₹{earningsData.availableBalance})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Total Lifetime Revenue */}
                  <div>
                    <div className="text-2xl sm:text-3xl font-black">
                      ₹{earningsData.totalEarnings}
                    </div>
                    <div className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Total Reader Sales
                    </div>
                  </div>

                  {/* Direct UPI Earnings */}
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-300">
                      ₹{earningsData.directUpiEarnings || 0}
                    </div>
                    <div className="text-xs text-amber-100 flex items-center gap-1 mt-1">
                      <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>Direct in your Bank (0 Day)</span>
                    </div>
                  </div>

                  {/* Gateway Available Balance */}
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      ₹{earningsData.availableBalance ?? earningsData.razorpayEarnings ?? 0}
                    </div>
                    <div className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
                      <DollarSign className="w-3.5 h-3.5" /> Withdrawable Balance
                    </div>
                  </div>

                  {/* Total Paid Out */}
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-200">
                      ₹{earningsData.totalWithdrawn || 0}
                    </div>
                    <div className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
                      <Check className="w-3.5 h-3.5" /> Total Withdrawn
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout & Withdrawal History */}
              {earningsData.payouts && earningsData.payouts.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Recent Payout History</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {earningsData.payouts.length} transfers
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {earningsData.payouts.map((po) => (
                      <div key={po._id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">
                            ₹{po.amount} transferred via {po.payoutMethod?.toUpperCase()}
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {new Date(po.createdAt).toLocaleDateString()} • Ref:{' '}
                            {po.referenceId || po._id}
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {po.status || 'Completed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-800">
                Your profile & payout destination have been updated successfully!
              </p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Profile Details Card */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b pb-3">
                Creator Information
              </h2>

              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Full Name / Pen Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your creator name"
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Creator Bio / Tagline
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Share a short bio about what you write and your daily life..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Email Address (Login ID)
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400">Used for passwordless one-time passcodes.</p>
              </div>
            </div>

            {/* Creator Payout Setup Card */}
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Payment & Payout Setup (Where You Get Paid)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    When readers subscribe to your diaries, your revenue is transferred to your UPI
                    ID or Bank Account.
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Payout Method Tabs */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutSettings((prev) => ({ ...prev, payoutMethod: 'upi' }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    payoutSettings.payoutMethod === 'upi'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Instant UPI ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutSettings((prev) => ({ ...prev, payoutMethod: 'bank' }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                    payoutSettings.payoutMethod === 'bank'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span>Bank Account Transfer</span>
                </button>
              </div>

              {payoutSettings.payoutMethod === 'upi' ? (
                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800">
                    Your UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={payoutSettings.upiId}
                    onChange={handlePayoutChange}
                    placeholder="e.g. alex@okaxis, yourname@upi, 9876543210@paytm"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    All reader payments will be credited directly to this UPI address.
                  </span>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={payoutSettings.accountHolderName}
                        onChange={handlePayoutChange}
                        placeholder="e.g. Alex River"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={payoutSettings.bankName}
                        onChange={handlePayoutChange}
                        placeholder="e.g. HDFC Bank, SBI"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={payoutSettings.accountNumber}
                        onChange={handlePayoutChange}
                        placeholder="e.g. 50100234567890"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={payoutSettings.ifscCode}
                        onChange={handlePayoutChange}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50"
              >
                {isLoading ? 'Saving Changes...' : 'Save Profile & Payout Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payout & Withdrawal Modal */}
      <RequestPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={earningsData?.availableBalance ?? (earningsData?.razorpayEarnings || 0)}
        payoutSettings={payoutSettings}
        onPayoutSuccess={() => {
          fetchEarnings();
        }}
      />
    </DashBoardLayout>
  );
};

export default ProfilePage;
