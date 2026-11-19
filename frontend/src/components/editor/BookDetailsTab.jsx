import { useState, useEffect } from 'react';
import InputField from '../ui/InputField';
import Button from '../ui/Button';
import DiaryCoverPicker from '../ui/DiaryCoverPicker';
import RequestPayoutModal from '../models/RequestPayoutModal';
import {
  DollarSign,
  CheckCircle2,
  Lock,
  Save,
  Building,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CATEGORIES = [
  'Daily Vlog',
  'Travel Vlog',
  'Career & Hustle',
  'Personal Growth',
  'Mindfulness',
  'Student Life',
  'Relationships',
];

const MOODS = [
  'Reflective',
  'Adventurous',
  'Candid',
  'Motivated',
  'Chill',
  'Humorous',
  'Emotional',
];

const BookDetailsTab = ({ book, onBookChange, onSave, isSaving }) => {
  const [payoutMethod, setPayoutMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const coverImageUrl =
    typeof book?.coverImage === 'string' && book.coverImage.startsWith('http')
      ? book.coverImage
      : book?.coverImage?.url
        ? book.coverImage.url
        : book?.coverImage
          ? `${BASE_URL}/${book.coverImage}`.replace(/\\/g, '/')
          : '';

  const isPaid = book?.accessType === 'paid' || Boolean(book?.isPremium);

  const plans = book?.plans || {
    weekly: { enabled: true, price: 49 },
    monthly: { enabled: true, price: book?.price || 149 },
    annual: { enabled: true, price: 899 },
  };

  // Fetch creator profile payout details & earnings
  useEffect(() => {
    const fetchProfileAndEarnings = async () => {
      try {
        const [profileRes, earningsRes] = await Promise.allSettled([
          axiosInstance.get(API_PATHS.AUTH.GET_PROFILE),
          axiosInstance.get(API_PATHS.PAYMENT.CREATOR_EARNINGS),
        ]);

        if (profileRes.status === 'fulfilled') {
          const payout = profileRes.value.data?.data?.payoutSettings;
          if (payout) {
            setPayoutMethod(payout.payoutMethod || 'upi');
            setUpiId(book?.upiId || payout.upiId || '');
            setBankDetails({
              accountHolderName: payout.accountHolderName || '',
              accountNumber: payout.accountNumber || '',
              ifscCode: payout.ifscCode || '',
              bankName: payout.bankName || '',
            });
          }
        }

        if (earningsRes.status === 'fulfilled') {
          setEarningsData(earningsRes.value.data?.data || null);
        }
      } catch (err) {
        console.error('Failed to load payout settings:', err);
      }
    };

    fetchProfileAndEarnings();
  }, [book?.upiId]);

  const handlePlanToggle = (planKey) => {
    const updatedPlans = {
      ...plans,
      [planKey]: {
        ...plans[planKey],
        enabled: !plans[planKey]?.enabled,
      },
    };
    onBookChange({ target: { name: 'plans', value: updatedPlans } });
  };

  const handlePlanPriceChange = (planKey, priceVal) => {
    const num = Math.max(0, parseInt(priceVal, 10) || 0);
    const updatedPlans = {
      ...plans,
      [planKey]: {
        ...plans[planKey],
        price: num,
      },
    };
    onBookChange({ target: { name: 'plans', value: updatedPlans } });
    if (planKey === 'monthly') {
      onBookChange({ target: { name: 'price', value: num } });
    }
  };

  // Save creator payout settings
  const handleSavePayout = async (e) => {
    if (e) e.preventDefault();
    setIsSavingPayout(true);
    try {
      await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        payoutSettings: {
          payoutMethod,
          upiId: upiId.trim(),
          accountHolderName: bankDetails.accountHolderName.trim(),
          accountNumber: bankDetails.accountNumber.trim(),
          ifscCode: bankDetails.ifscCode.trim(),
          bankName: bankDetails.bankName.trim(),
        },
      });
      if (onBookChange) {
        onBookChange({ target: { name: 'upiId', value: upiId.trim() } });
      }
      toast.success(
        'Payout destination saved! Reader subscription earnings will be credited directly to your UPI address.'
      );
    } catch (err) {
      console.error('Save payout error:', err);
      toast.error('Failed to save payout settings.');
    } finally {
      setIsSavingPayout(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Current Status
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-900 font-black text-xs rounded-full">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                Live: Subscription-Based (Paid)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live: 100% Free for Everyone
              </span>
            )}
            <span className="text-xs text-gray-400">• Switch anytime below</span>
          </div>
        </div>

        {onSave && (
          <Button
            onClick={onSave}
            isLoading={isSaving}
            icon={Save}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs"
          >
            Save Diary Changes
          </Button>
        )}
      </div>

      {/* ----- Creator Earnings Snapshot ----- */}
      {earningsData && earningsData.totalEarnings > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 block">
                Your Diary Revenue & Payouts
              </span>
              <span className="text-xs text-emerald-50">
                {earningsData.activeSubscribersCount || 0} active subscribers
              </span>
            </div>

            {earningsData.availableBalance > 0 && (
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw ₹{earningsData.availableBalance}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-2xl font-black">₹{earningsData.totalEarnings}</div>
              <div className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Total Revenue
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-amber-300">
                ₹{earningsData.directUpiEarnings || 0}
              </div>
              <div className="text-[11px] text-amber-100 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> In Your Bank
              </div>
            </div>

            <div>
              <div className="text-2xl font-black">
                ₹{earningsData.availableBalance ?? earningsData.razorpayEarnings ?? 0}
              </div>
              <div className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Available
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-200">
                ₹{earningsData.totalWithdrawn || 0}
              </div>
              <div className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Withdrawn
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----- Access Model & Pricing (Switch Anytime from Free to Paid) ----- */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <div>
          <h3 className="font-extrabold text-gray-900 text-lg">Diary Monetization: Free or Paid</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            You have full control. You can change anytime between Free and Paid. Switch between
            public free access and reader subscriptions with 1 click.
          </p>
        </div>

        {/* Free vs Paid Toggle Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => {
              onBookChange({ target: { name: 'accessType', value: 'free' } });
              onBookChange({ target: { name: 'isPremium', value: false } });
              onBookChange({ target: { name: 'price', value: 0 } });
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              !isPaid
                ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Free for Readers</span>
            </div>
            <p className="text-xs text-gray-500 font-normal leading-relaxed">
              Anyone can read all your past and new daily memories for free without any paywall.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              onBookChange({ target: { name: 'accessType', value: 'paid' } });
              onBookChange({ target: { name: 'isPremium', value: true } });
              onBookChange({ target: { name: 'price', value: plans.monthly?.price || 149 } });
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              isPaid
                ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 mb-1.5">
              <Lock className="w-4 h-4" />
              <span>Subscription-Based (Paid)</span>
            </div>
            <p className="text-xs text-gray-500 font-normal leading-relaxed">
              Readers pay money to subscribe and unlock your personal diary entries.
            </p>
          </button>
        </div>

        {/* Subscription Plan Configurator (When Paid) */}
        {isPaid && (
          <div className="p-5 bg-gradient-to-br from-indigo-50/50 via-purple-50/40 to-amber-50/40 border border-indigo-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider block">
                  Define Your Subscription Plans & Prices
                </span>
                <span className="text-[11px] text-gray-500">
                  Readers will choose from these plans to subscribe to you
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-600">Currency: ₹ INR</span>
            </div>

            {/* Weekly Plan */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={plans.weekly?.enabled ?? true}
                  onChange={() => handlePlanToggle('weekly')}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900">Weekly Pass</span>
                  <span className="block text-[11px] text-gray-400 font-normal">
                    7 Days Access for Readers
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  disabled={!(plans.weekly?.enabled ?? true)}
                  value={plans.weekly?.price ?? 49}
                  onChange={(e) => handlePlanPriceChange('weekly', e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm font-bold text-right border border-gray-300 rounded-xl outline-none focus:border-indigo-600 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Monthly Plan */}
            <div className="flex items-center justify-between p-3.5 bg-white border-2 border-indigo-300 rounded-xl shadow-xs bg-indigo-50/20">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-900">
                <input
                  type="checkbox"
                  checked={plans.monthly?.enabled ?? true}
                  onChange={() => handlePlanToggle('monthly')}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Monthly Membership</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md">
                      Popular
                    </span>
                  </div>
                  <span className="block text-[11px] text-gray-400 font-normal">
                    30 Days Access for Readers
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  disabled={!(plans.monthly?.enabled ?? true)}
                  value={plans.monthly?.price ?? 149}
                  onChange={(e) => handlePlanPriceChange('monthly', e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm font-bold text-right border border-indigo-300 rounded-xl outline-none focus:border-indigo-600 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Annual Plan */}
            <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-800">
                <input
                  type="checkbox"
                  checked={plans.annual?.enabled ?? true}
                  onChange={() => handlePlanToggle('annual')}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Annual VIP Pass</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">
                      Best Value
                    </span>
                  </div>
                  <span className="block text-[11px] text-gray-400 font-normal">
                    365 Days Access for Readers
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  disabled={!(plans.annual?.enabled ?? true)}
                  value={plans.annual?.price ?? 899}
                  onChange={(e) => handlePlanPriceChange('annual', e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm font-bold text-right border border-gray-300 rounded-xl outline-none focus:border-indigo-600 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Free Preview Entries */}
            <div className="flex items-center justify-between pt-3 border-t border-indigo-200/60">
              <div>
                <label className="block text-xs font-bold text-gray-900">
                  Free Preview Entries Count
                </label>
                <span className="text-[11px] text-gray-500">
                  Number of days new readers can read for free before being asked to subscribe
                </span>
              </div>
              <input
                type="number"
                name="freePreviewEntries"
                min="0"
                max="30"
                value={book?.freePreviewEntries ?? 2}
                onChange={onBookChange}
                className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ----- Creator Payout Destination Setup ("Setup Things for Him") ----- */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg">Creator Payout Setup</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tell us where to send your subscription earnings. Readers pay via Razorpay/UPI/Cards,
              and your earnings are transferred directly to you.
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Payout Method Tabs (UPI vs Bank) */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPayoutMethod('upi')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              payoutMethod === 'upi'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Instant UPI ID (Recommended)</span>
          </button>

          <button
            type="button"
            onClick={() => setPayoutMethod('bank')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              payoutMethod === 'bank'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Bank Account Transfer</span>
          </button>
        </div>

        {/* UPI Form */}
        {payoutMethod === 'upi' ? (
          <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                <span>Your UPI ID / VPA (Direct Reader Payments)</span>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  ⚡ Instant • Direct to your Bank
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. alex@okaxis, yourname@upi, 9876543210@paytm"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (onBookChange) {
                    onBookChange({ target: { name: 'upiId', value: e.target.value } });
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Readers pay directly to this UPI address via QR code / UPI apps (GPay, PhonePe,
                Paytm). The money goes directly to your bank account with zero middleman or
                withdrawal delays.
              </span>
            </div>

            <Button
              onClick={handleSavePayout}
              isLoading={isSavingPayout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs"
            >
              Save Payout UPI ID
            </Button>
          </div>
        ) : (
          /* Bank Account Form */
          <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex River"
                  value={bankDetails.accountHolderName}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, accountHolderName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  value={bankDetails.bankName}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 50100234567890"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankDetails.ifscCode}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, ifscCode: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button
              onClick={handleSavePayout}
              isLoading={isSavingPayout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-xs"
            >
              Save Bank Account Details
            </Button>
          </div>
        )}
      </div>

      {/* ----- Diary Details (Title, Author, Category, Mood) ----- */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-gray-900 text-base">Diary Metadata & Overview</h3>

        <InputField
          label="Title"
          name="title"
          value={book?.title || ''}
          onChange={onBookChange}
          placeholder="e.g. My Tokyo Summer Diaries"
        />

        <InputField
          label="Author / Creator Name"
          name="author"
          value={book?.author || ''}
          onChange={onBookChange}
          placeholder="Your name or channel name"
        />

        <InputField
          label="Tagline / Summary"
          name="subtitle"
          value={book?.subtitle || ''}
          onChange={onBookChange}
          placeholder="A quick summary of this diary series"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
            <select
              name="category"
              value={book?.category || 'Daily Vlog'}
              onChange={onBookChange}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mood / Vibe</label>
            <select
              name="mood"
              value={book?.mood || 'Candid'}
              onChange={onBookChange}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ----- Cover Photo & Appearance ----- */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-base">Cover Photo & Appearance</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Customize the look of your personal diary cover. Readers will see this in their explore
            feed, library, and checkout.
          </p>
        </div>

        <DiaryCoverPicker
          coverImage={coverImageUrl}
          onChange={(newUrl) => onBookChange({ target: { name: 'coverImage', value: newUrl } })}
          title={book?.title || 'My Personal Diary'}
          author={book?.author || 'Diary Creator'}
          category={book?.category || 'Daily Vlog'}
        />
      </div>

      {/* Bottom Save Bar */}
      {onSave && (
        <div className="pt-4 flex justify-end">
          <Button
            onClick={onSave}
            isLoading={isSaving}
            icon={Save}
            className="w-full sm:w-auto py-3 px-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            Save All Changes
          </Button>
        </div>
      )}

      {/* Payout & Withdrawal Modal */}
      <RequestPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        availableBalance={earningsData?.availableBalance ?? (earningsData?.razorpayEarnings || 0)}
        payoutSettings={{
          payoutMethod,
          upiId,
          ...bankDetails,
        }}
        onPayoutSuccess={() => {
          axiosInstance
            .get(API_PATHS.PAYMENT.CREATOR_EARNINGS)
            .then((res) => setEarningsData(res.data?.data || null))
            .catch(() => {});
        }}
      />
    </div>
  );
};

export default BookDetailsTab;
