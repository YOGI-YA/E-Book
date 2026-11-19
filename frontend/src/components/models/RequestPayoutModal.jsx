import { useState, useEffect } from 'react';
import { Smartphone, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';

const RequestPayoutModal = ({
  isOpen,
  onClose,
  availableBalance = 0,
  payoutSettings = {},
  onPayoutSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (availableBalance > 0) {
      setAmount(String(availableBalance));
    } else {
      setAmount('');
    }
  }, [availableBalance, isOpen]);

  const payoutMethod = payoutSettings?.payoutMethod || 'upi';
  const upiId = payoutSettings?.upiId || '';
  const bankDetails = payoutSettings || {};

  const hasValidDestination =
    payoutMethod === 'upi'
      ? Boolean(upiId.trim())
      : Boolean(bankDetails.accountNumber && bankDetails.ifscCode);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (numAmount > availableBalance) {
      toast.error(`Amount exceeds available balance of ₹${availableBalance}`);
      return;
    }

    if (!hasValidDestination) {
      toast.error('Please configure your UPI ID or Bank Account destination first.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Initiating payout transfer...');

    try {
      const res = await axiosInstance.post(API_PATHS.PAYMENT.REQUEST_PAYOUT, {
        amount: numAmount,
      });

      toast.success(res.data?.message || 'Payout processed successfully!', { id: toastId });
      onClose();
      if (onPayoutSuccess) {
        onPayoutSuccess();
      }
    } catch (err) {
      console.error('Payout request error:', err);
      toast.error(err.response?.data?.message || 'Failed to process payout. Please try again.', {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Creator Payout / Withdrawal">
      <form onSubmit={handleSubmit} className="space-y-5 text-gray-800">
        {/* Available Balance Box */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium block">
              Withdrawable Gateway Balance
            </span>
            <span className="text-2xl font-black text-emerald-800">₹{availableBalance}</span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              (Direct UPI earnings are already in your bank)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAmount(String(availableBalance))}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Withdraw All
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Withdrawal Amount (₹ INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
              ₹
            </span>
            <input
              type="number"
              min="1"
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-base font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Payout Destination Preview */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              {payoutMethod === 'upi' ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Transfer Destination: UPI</span>
                </>
              ) : (
                <>
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Transfer Destination: Bank Transfer</span>
                </>
              )}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Direct Transfer
            </span>
          </div>

          {payoutMethod === 'upi' ? (
            upiId ? (
              <div className="text-xs font-mono font-bold text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                {upiId}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>No UPI ID configured. Please set your UPI ID in Profile.</span>
              </div>
            )
          ) : bankDetails.accountNumber ? (
            <div className="text-xs font-medium text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
              <div>
                <span className="font-bold text-gray-900">{bankDetails.accountHolderName}</span> •{' '}
                {bankDetails.bankName || 'Bank'}
              </div>
              <div className="font-mono text-gray-500 text-[11px]">
                A/C: ****{bankDetails.accountNumber.slice(-4)} • IFSC: {bankDetails.ifscCode}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>No bank account configured. Please update in Profile.</span>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Processed directly to your verified payout destination. Zero platform cut.</span>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!hasValidDestination || availableBalance <= 0}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          Confirm Withdrawal of ₹{amount || 0}
        </Button>
      </form>
    </Modal>
  );
};

export default RequestPayoutModal;
