import { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  CreditCard,
  Check,
  AlertCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';

const SubscriptionCheckoutModal = ({
  isOpen,
  onClose,
  book,
  initialPlanType = 'monthly',
  onPaymentSuccess,
  onPayWithRazorpay,
  isRazorpayLoading = false,
}) => {
  const [selectedPlan, setSelectedPlan] = useState(initialPlanType);
  const [paymentMethod, setPaymentMethod] = useState('direct_upi'); // 'direct_upi' | 'razorpay'
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (initialPlanType) {
      setSelectedPlan(initialPlanType);
    }
  }, [initialPlanType]);

  if (!book) return null;

  const plans = book.plans || {
    weekly: { enabled: true, price: 49 },
    monthly: { enabled: true, price: book.price || 149 },
    annual: { enabled: true, price: 899 },
  };

  const currentPrice =
    plans[selectedPlan]?.price ||
    (selectedPlan === 'weekly' ? 49 : selectedPlan === 'annual' ? 899 : 149);

  const planDurationText =
    selectedPlan === 'weekly'
      ? '7 Days Full Access'
      : selectedPlan === 'annual'
        ? '365 Days VIP Access'
        : '30 Days Full Access';

  // Creator Payout Details (from diary creatorPayout or direct upiId)
  const creatorUpiId = book.creatorPayout?.upiId || book.upiId || '';

  const creatorName = book.creatorPayout?.accountHolderName || book.author || 'Diary Creator';

  // Construct NPCI standard UPI URI
  const note = `LifeLog Sub: ${book.title?.slice(0, 20) || 'Diary'}`;
  const upiUri = `upi://pay?pa=${encodeURIComponent(creatorUpiId)}&pn=${encodeURIComponent(creatorName)}&am=${currentPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Specific App URIs
  const gpayUri = `gpay://upi/pay?pa=${encodeURIComponent(creatorUpiId)}&pn=${encodeURIComponent(creatorName)}&am=${currentPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(creatorUpiId)}&pn=${encodeURIComponent(creatorName)}&am=${currentPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(creatorUpiId)}&pn=${encodeURIComponent(creatorName)}&am=${currentPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  // High-Resolution QR Server URL
  const qrCodeUrl = creatorUpiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(upiUri)}`
    : '';

  const handleCopyUpi = () => {
    if (!creatorUpiId) return;
    navigator.clipboard.writeText(creatorUpiId);
    setCopiedUpi(true);
    toast.success('Creator UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleDirectUpiConfirm = async (e) => {
    if (e) e.preventDefault();

    setIsVerifyingUpi(true);
    const toastId = toast.loading('Verifying direct payment & unlocking diary...');

    try {
      const res = await axiosInstance.post(API_PATHS.PAYMENT.DIRECT_UPI_CONFIRM, {
        diaryId: book._id,
        planType: selectedPlan,
        upiTransactionRef: utrNumber.trim(),
        upiId: creatorUpiId,
      });

      toast.success(res.data?.message || 'Payment confirmed! Diary unlocked.', {
        id: toastId,
      });

      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      console.error('Direct UPI confirm error:', err);
      toast.error(err.response?.data?.message || 'Failed to verify payment. Please try again.', {
        id: toastId,
      });
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Unlock Personal Diary Subscription">
      <div className="space-y-5 max-h-[82vh] overflow-y-auto pr-1 text-gray-800">
        {/* Diary Info Mini Banner */}
        <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-amber-50/80 via-indigo-50/60 to-purple-50/80 border border-amber-200/80 rounded-2xl">
          <div className="w-12 h-16 rounded-lg bg-neutral-900 overflow-hidden shadow-md flex-shrink-0 relative">
            {book.coverImage ? (
              <img
                src={typeof book.coverImage === 'string' ? book.coverImage : book.coverImage?.url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-amber-700" />
            )}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/40" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md">
              {book.category || 'Personal Diary'}
            </span>
            <h4 className="text-sm font-black text-gray-900 truncate mt-1">{book.title}</h4>
            <p className="text-xs text-gray-500">by {book.author}</p>
          </div>
        </div>

        {/* Plan Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            1. Select Subscription Pass
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Weekly */}
            {plans.weekly?.enabled && (
              <button
                type="button"
                onClick={() => setSelectedPlan('weekly')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedPlan === 'weekly'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="text-[11px] font-semibold text-gray-500">Weekly</div>
                <div className="text-lg font-black text-gray-900">₹{plans.weekly.price}</div>
                <div className="text-[10px] text-gray-400">7 Days</div>
              </button>
            )}

            {/* Monthly */}
            {plans.monthly?.enabled && (
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`relative p-3 rounded-xl border text-center transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] rounded-full shadow-xs whitespace-nowrap">
                  Popular
                </span>
                <div className="text-[11px] font-semibold text-gray-500">Monthly</div>
                <div className="text-lg font-black text-gray-900">₹{plans.monthly.price}</div>
                <div className="text-[10px] text-gray-400">30 Days</div>
              </button>
            )}

            {/* Annual */}
            {plans.annual?.enabled && (
              <button
                type="button"
                onClick={() => setSelectedPlan('annual')}
                className={`relative p-3 rounded-xl border text-center transition-all ${
                  selectedPlan === 'annual'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-emerald-600 text-white font-black text-[9px] rounded-full shadow-xs whitespace-nowrap">
                  Best Value
                </span>
                <div className="text-[11px] font-semibold text-gray-500">Annual</div>
                <div className="text-lg font-black text-gray-900">₹{plans.annual.price}</div>
                <div className="text-[10px] text-gray-400">365 Days</div>
              </button>
            )}
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            2. Choose Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('direct_upi')}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentMethod === 'direct_upi'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Direct UPI & Scanner</span>
              </div>
              <p className="text-[11px] text-gray-500 font-normal leading-tight">
                0% fees • Money goes 100% directly to creator’s bank.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('razorpay')}
              className={`p-3 rounded-xl border text-left transition-all ${
                paymentMethod === 'razorpay'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Razorpay Gateway</span>
              </div>
              <p className="text-[11px] text-gray-500 font-normal leading-tight">
                Cards, NetBanking, Wallets & Gateway UPI.
              </p>
            </button>
          </div>
        </div>

        {/* METHOD A: DIRECT UPI & QR SCANNER */}
        {paymentMethod === 'direct_upi' && (
          <div className="space-y-4 p-4.5 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-amber-50/30 border border-indigo-200/80 rounded-2xl">
            {creatorUpiId ? (
              <>
                {/* Payee Info & Price Tag */}
                <div className="flex items-center justify-between pb-3 border-b border-indigo-200/60">
                  <div>
                    <span className="text-[11px] text-gray-500 font-medium block">
                      Paying Directly To Creator
                    </span>
                    <span className="text-sm font-black text-gray-900 flex items-center gap-1">
                      {creatorName}
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-medium">
                      Exact Amount
                    </span>
                    <span className="text-xl font-black text-indigo-700">₹{currentPrice}</span>
                  </div>
                </div>

                {/* Creator UPI ID Pill with Copy */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                      Creator UPI Address (VPA)
                    </span>
                    <span className="text-xs font-bold text-gray-900 font-mono truncate block">
                      {creatorUpiId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Laptop / Desktop QR Scanner Section */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-gray-800">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Scan with Any UPI App (GPay, PhonePe, Paytm, BHIM)</span>
                  </div>

                  {/* QR Code Container */}
                  <div className="inline-block p-3 bg-white border-2 border-indigo-200 rounded-2xl shadow-inner">
                    {qrCodeUrl ? (
                      <img
                        src={qrCodeUrl}
                        alt="UPI Payment QR Code"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        Generating QR Code...
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Point your mobile camera or scanner in GPay, PhonePe, Paytm, or BHIM.
                  </p>
                </div>

                {/* Mobile Direct App Links ("Direct redirect user to online payment app") */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Or Tap to Open UPI App on Mobile:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Google Pay */}
                    <a
                      href={gpayUri}
                      className="py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 text-center flex items-center justify-center gap-1.5 shadow-2xs hover:border-indigo-400 transition-all"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Google Pay
                    </a>

                    {/* PhonePe */}
                    <a
                      href={phonepeUri}
                      className="py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 text-center flex items-center justify-center gap-1.5 shadow-2xs hover:border-indigo-400 transition-all"
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      PhonePe
                    </a>

                    {/* Paytm */}
                    <a
                      href={paytmUri}
                      className="py-2 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 text-center flex items-center justify-center gap-1.5 shadow-2xs hover:border-indigo-400 transition-all"
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Paytm
                    </a>

                    {/* Any UPI / BHIM */}
                    <a
                      href={upiUri}
                      className="py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Any App
                    </a>
                  </div>
                </div>

                {/* Step 3: Confirmation / UTR Input */}
                <form
                  onSubmit={handleDirectUpiConfirm}
                  className="space-y-3 pt-3 border-t border-indigo-200/60"
                >
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1">
                      Enter UPI Transaction ID / UTR Number{' '}
                      <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 432109876543 (from GPay / PhonePe receipt)"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Once you finish scanning or paying in your app, click below to immediately
                      unlock this diary!
                    </span>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isVerifyingUpi}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    I Have Paid ₹{currentPrice} • Verify & Unlock Diary
                  </Button>
                </form>
              </>
            ) : (
              /* Creator hasn't configured UPI ID fallback */
              <div className="text-center py-6 space-y-3 bg-white rounded-2xl border border-gray-200 p-5">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Direct UPI Pending Setup by Creator
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    The creator has not set their personal UPI ID yet. You can still unlock this
                    diary instantly using the Razorpay gateway below.
                  </p>
                </div>
                <Button
                  onClick={() => setPaymentMethod('razorpay')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl"
                >
                  Pay via Razorpay Gateway
                </Button>
              </div>
            )}
          </div>
        )}

        {/* METHOD B: RAZORPAY GATEWAY */}
        {paymentMethod === 'razorpay' && (
          <div className="space-y-4 p-5 bg-white border border-gray-200 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Subscription Plan</span>
                <span className="text-sm font-black text-gray-900">
                  {selectedPlan.toUpperCase()} Pass ({planDurationText})
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block font-medium">Total</span>
                <span className="text-2xl font-black text-indigo-600">₹{currentPrice}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Credit Cards, Debit Cards, NetBanking, UPI & Wallets</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>256-bit encrypted Razorpay checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Instant automatic unlock & email receipt</span>
              </div>
            </div>

            <Button
              onClick={() => {
                if (onPayWithRazorpay) {
                  onPayWithRazorpay(selectedPlan);
                }
              }}
              isLoading={isRazorpayLoading}
              icon={CreditCard}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              Pay ₹{currentPrice} via Razorpay Gateway
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SubscriptionCheckoutModal;
