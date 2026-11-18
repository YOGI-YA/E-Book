import { useState } from 'react';
import { BookOpen, DollarSign, Palette, Save, Tag, Smile, Sparkles, Calendar } from 'lucide-react';
import Modal from '../ui/Modal';
import InputField from '../ui/InputField';
import SelectField from '../ui/SelectedField';
import Button from '../ui/Button';
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
  const [initialThought, setInitialThought] = useState('');

  // Monetization fields
  const [isMonetized, setIsMonetized] = useState(false);
  const [price, setPrice] = useState(99);
  const [freePreviewEntries, setFreePreviewEntries] = useState(2);

  const [isCreating, setIsCreating] = useState(false);

  const resetModal = () => {
    setTitle('');
    setSubtitle('');
    setCategory('Daily Vlog');
    setMood('Candid');
    setInitialThought('');
    setIsMonetized(false);
    setPrice(99);
    setFreePreviewEntries(2);
    setIsCreating(false);
  };

  const handleCreateDiary = async (e) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your diary.');
      return;
    }

    setIsCreating(true);
    try {
      // Create with a welcoming first entry
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

      const response = await axiosInstance.post(API_PATHS.DIARIES.CREATE, {
        title: title.trim(),
        subtitle:
          subtitle.trim() || 'A living stream of daily thoughts, memories, photos & videos.',
        author: user?.name || 'Anonymous Creator',
        category,
        mood,
        isPremium: isMonetized && Number(price) > 0,
        price: isMonetized ? Number(price) : 0,
        freePreviewEntries: Number(freePreviewEntries) || 2,
        chapters: [initialEntry],
      });

      const newId = response.data?.data?._id;
      toast.success('Life Diary created! You can now log memories anytime.');
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
      title="Start Your Living Life Diary"
    >
      <form onSubmit={handleCreateDiary} className="space-y-4">
        <p className="text-xs text-gray-500">
          This is your personal life chronicle. You can write entries anytime, add photos and video
          clips, and write as little or as much as you want.
        </p>

        <InputField
          icon={BookOpen}
          label="Diary Title"
          placeholder="e.g. My 2026 Life Chronicles, Solo Travel & Food..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <InputField
          icon={Tag}
          label="Tagline / Bio"
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

        {/* Monetization Card */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <div>
                <div className="text-sm font-bold text-amber-950">Monetize with Razorpay</div>
                <div className="text-xs text-amber-700">
                  Readers pay once to unlock all past and future days
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isMonetized}
              onChange={(e) => setIsMonetized(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {isMonetized && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Unlock Price (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Free Teaser Entries
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={freePreviewEntries}
                  onChange={(e) => setFreePreviewEntries(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
