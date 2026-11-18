import InputField from '../ui/InputField';
import Button from '../ui/Button';
import { UploadCloud, DollarSign, Sparkles } from 'lucide-react';

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

const BookDetailsTab = ({ book, onBookChange, onCoverUpload, isUploading, fileInputRef }) => {
  const coverImageUrl =
    typeof book?.coverImage === 'string' && book.coverImage.startsWith('http')
      ? book.coverImage
      : book?.coverImage?.url
        ? book.coverImage.url
        : book?.coverImage
          ? `${BASE_URL}/${book.coverImage}`.replace(/\\/g, '/')
          : '';

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      {/* ----- Diary Info ----- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Diary & Vlog Details</h3>

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

      {/* ----- Monetization & Pricing (Razorpay) ----- */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              ₹
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Monetization & Razorpay Paywall</h3>
              <p className="text-xs text-amber-700">
                Set a price for readers to unlock all entries
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isPremium"
              checked={Boolean(book?.isPremium)}
              onChange={(e) =>
                onBookChange({ target: { name: 'isPremium', value: e.target.checked } })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {book?.isPremium && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-amber-200/60">
            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Unlock Price (₹ INR)
              </label>
              <input
                type="number"
                name="price"
                min="1"
                value={book?.price ?? 99}
                onChange={onBookChange}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-950 mb-1">
                Free Preview Entries Count
              </label>
              <input
                type="number"
                name="freePreviewEntries"
                min="0"
                value={book?.freePreviewEntries ?? 1}
                onChange={onBookChange}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-amber-800">
                Number of entries open for free reading before the paywall.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ----- Cover Image Section ----- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Cover Photo</h3>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-36 h-48 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 overflow-hidden shadow-md flex items-center justify-center flex-shrink-0">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-white text-xs font-bold text-center p-3">No Cover Photo</span>
            )}
          </div>

          <div className="space-y-3 flex-1 text-center sm:text-left">
            <p className="text-xs text-gray-500">
              Upload a beautiful cover photo for your daily diary vlog. JPG, PNG or WebP supported.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onCoverUpload}
              accept="image/*"
              className="hidden"
            />

            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
              icon={UploadCloud}
              className="rounded-xl text-xs py-2.5"
            >
              {isUploading ? 'Uploading to Cloud...' : 'Choose Cover Image'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsTab;
