import { useState } from 'react';
import { BookOpen, Palette, Save, Tag, Smile, CheckCircle2, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectedField';
import Button from '../ui/Button';
import DiaryCoverPicker from '../ui/DiaryCoverPicker';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Daily Vlog',
  'Travel Vlog',
  'Career & Hustle',
  'Personal Growth',
  'Mindfulness',
  'Student Life',
  'Relationships & Love',
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

const CreateBookModal = ({ isOpen, onClose, onBookCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Daily Vlog');
  const [mood, setMood] = useState('Candid');
  const [coverImage, setCoverImage] = useState('');
  const [upiId, setUpiId] = useState(user?.payoutSettings?.upiId || '');
  const [initialThought, setInitialThought] = useState('');

  // Access model: 'free' or 'paid'
  const [accessType, setAccessType] = useState('free');

  // Creator-defined subscription plans
  const [plans, setPlans] = useState({
    weekly: { enabled: true, price: 49 },
    monthly: { enabled: true, price: 149 },
    annual: { enabled: true, price: 899 },
  });

  const [freePreviewEntries, setFreePreviewEntries] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  const resetModal = () => {
    setTitle('');
    setSubtitle('');
    setCategory('Daily Vlog');
    setMood('Candid');
    setCoverImage('');
    setUpiId(user?.payoutSettings?.upiId || '');
    setInitialThought('');
    setAccessType('free');
    setPlans({
      weekly: { enabled: true, price: 49 },
      monthly: { enabled: true, price: 149 },
      annual: { enabled: true, price: 899 },
    });
    setFreePreviewEntries(2);
    setIsCreating(false);
  };

  const handlePlanToggle = (planKey) => {
    setPlans((prev) => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        enabled: !prev[planKey].enabled,
      },
    }));
  };

  const handlePlanPriceChange = (planKey, priceVal) => {
    const num = Math.max(0, parseInt(priceVal, 10) || 0);
    setPlans((prev) => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        price: num,
      },
    }));
  };

  const handleCreateDiary = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your diary.');
      return;
    }

    setIsCreating(true);
    try {
      const initialEntry = {
        title: 'Day 1: Starting my Diary',
        description: 'First memory logged in this diary stream.',
        content:
          initialThought.trim() ||
          'Started this diary today. Excited to share my daily life, raw moments, and memories here.',
        date: new Date(),
        mood: mood,
        weather: 'Sunny',
        timeOfDay: 'Evening',
        photos: [],
        videos: [],
      };

      const isPaid = accessType === 'paid';

      const response = await axiosInstance.post(API_PATHS.DIARIES.CREATE, {
        title: title.trim(),
        subtitle:
          subtitle.trim() || 'A living stream of daily thoughts, memories, photos & videos.',
        author: user?.name || 'Anonymous Creator',
        coverImage: coverImage.trim() || undefined,
        upiId: upiId.trim() || undefined,
        category,
        mood,
        accessType,
        isPremium: isPaid,
        price: isPaid ? plans.monthly.price : 0,
        plans: isPaid ? plans : undefined,
        freePreviewEntries: isPaid ? Number(freePreviewEntries) || 2 : 999,
        chapters: [initialEntry],
      });

      const newId = response.data?.data?._id;
      toast.success('Life Diary created! You can now write memories anytime.');
      onBookCreated(newId);
      onClose();
      resetModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create diary');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetModal();
      }}
      title="Start Your Living Personal Diary"
    >
      <form onSubmit={handleCreateDiary} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        <p className="text-xs text-gray-500">
          This is your personal diary stream. You can write daily entries anytime, upload photos and
          videos, and choose whether to make it completely free or subscription-based.
        </p>

        <InputField
          icon={BookOpen}
          label="Diary Title"
          placeholder="e.g. My 2026 Life Chronicles, Travel & Raw Thoughts..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <InputField
          icon={Tag}
          label="Tagline / Summary"
          placeholder="e.g. Candid daily thoughts, coffee chats, and memories."
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            icon={Palette}
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
          />

          <SelectField
            icon={Smile}
            label="Default Mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            options={MOODS}
          />
        </div>

        {/* Diary Cover Picker (Presets, File Upload, Direct URL & Live Preview) */}
        <div>
          <DiaryCoverPicker
            coverImage={coverImage}
            onChange={setCoverImage}
            title={title}
            author={user?.name || 'You'}
            category={category}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            First Thought for Day 1 <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={initialThought}
            onChange={(e) => setInitialThought(e.target.value)}
            rows={2}
            placeholder="What made you want to start writing today? (You can add photos & videos once created)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Subscription Model Selection */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
              Reader Access & Monetization
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setAccessType('free')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  accessType === 'free'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Free for Readers
                </div>
                <p className="text-[11px] text-gray-500 font-normal">
                  Anyone can read all your diary entries for free.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAccessType('paid')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  accessType === 'paid'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/30'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-1">
                  <Lock className="w-3.5 h-3.5" /> Subscription-based
                </div>
                <p className="text-[11px] text-gray-500 font-normal">
                  Readers pay to unlock and read your personal diary.
                </p>
              </button>
            </div>
          </div>

          {/* User-Defined Subscription Plans */}
          {accessType === 'paid' && (
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">
                  Define Your Subscription Plans
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">
                  Set your own pricing in ₹
                </span>
              </div>

              {/* Weekly Plan */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={plans.weekly.enabled}
                    onChange={() => handlePlanToggle('weekly')}
                    className="accent-indigo-600 w-4 h-4 rounded"
                  />
                  <span>Weekly Plan (7 Days)</span>
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!plans.weekly.enabled}
                    value={plans.weekly.price}
                    onChange={(e) => handlePlanPriceChange('weekly', e.target.value)}
                    className="w-18 px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-indigo-500 text-right disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Monthly Plan */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-indigo-200 rounded-xl bg-indigo-50/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={plans.monthly.enabled}
                    onChange={() => handlePlanToggle('monthly')}
                    className="accent-indigo-600 w-4 h-4 rounded"
                  />
                  <span>Monthly Plan (30 Days)</span>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                    Popular
                  </span>
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!plans.monthly.enabled}
                    value={plans.monthly.price}
                    onChange={(e) => handlePlanPriceChange('monthly', e.target.value)}
                    className="w-18 px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-indigo-500 text-right disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Annual Plan */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={plans.annual.enabled}
                    onChange={() => handlePlanToggle('annual')}
                    className="accent-indigo-600 w-4 h-4 rounded"
                  />
                  <span>Annual Plan (365 Days)</span>
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                    Best Value
                  </span>
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    disabled={!plans.annual.enabled}
                    value={plans.annual.price}
                    onChange={(e) => handlePlanPriceChange('annual', e.target.value)}
                    className="w-18 px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-indigo-500 text-right disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Free Teaser Entries */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="block text-xs font-bold text-gray-800">
                    Free Preview Entries
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Days readers can read before paywall
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={freePreviewEntries}
                  onChange={(e) => setFreePreviewEntries(parseInt(e.target.value, 10) || 0)}
                  className="w-16 px-2 py-1 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-indigo-500 text-center"
                />
              </div>

              {/* Creator Direct UPI Address for QR Scanner */}
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center justify-between">
                  <span>Your Direct UPI ID (For Direct Payments & QR Scanner)</span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    ⚡ Zero Fee Direct to Bank
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis, 9876543210@paytm, name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Readers will scan a QR code or tap GPay/PhonePe to pay directly to this address.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isCreating}
            icon={Save}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            Create Diary & Open Journal
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBookModal;
