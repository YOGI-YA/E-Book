import { useState, useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  Link as LinkIcon,
  Check,
  Trash2,
  Image as ImageIcon,
  BookOpen,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import { PRESET_DIARY_COVERS } from '../../utils/data';

const DiaryCoverPicker = ({
  coverImage = '',
  onChange,
  title = 'My Life Diary',
  author = 'Diary Creator',
  category = 'Daily Vlog',
}) => {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const currentCoverUrl = typeof coverImage === 'string' ? coverImage : coverImage?.url || '';

  // Handle Preset Selection
  const handleSelectPreset = (presetUrl) => {
    onChange(presetUrl);
    toast.success('Cover applied!');
  };

  // Handle Direct URL Submission
  const handleApplyUrl = (e) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Please enter an image URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      toast.error('URL must begin with http:// or https://');
      return;
    }
    onChange(trimmed);
    setUrlInput('');
    toast.success('Custom cover URL applied!');
  };

  // Handle Device File Upload via Cloudinary API
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size must be under 15MB.');
      return;
    }

    const formData = new FormData();
    formData.append('media', file);

    setIsUploading(true);
    const toastId = toast.loading('Uploading diary cover to cloud...');
    try {
      const res = await axiosInstance.post(API_PATHS.DIARIES.UPLOAD_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        toast.success('Cover uploaded successfully!', { id: toastId });
      } else {
        toast.error('Failed to get uploaded image URL.', { id: toastId });
      }
    } catch (err) {
      console.error('Cover upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image. Please try again.', {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCover = () => {
    onChange('');
    toast.success('Cover removed. Default leather spine restored.');
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Live Preview */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-gradient-to-br from-amber-50/50 via-indigo-50/30 to-purple-50/40 border border-amber-200/60 rounded-2xl">
        {/* Realistic Book Cover 3D Preview */}
        <div className="relative group w-32 h-44 sm:w-36 sm:h-48 rounded-xl overflow-hidden shadow-xl border-2 border-amber-900/30 flex-shrink-0 bg-neutral-900 flex flex-col justify-between transition-transform duration-300 hover:scale-105">
          {/* Spine crease shadow on left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-20 pointer-events-none" />
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/20 z-20 pointer-events-none" />

          {/* Background image or gradient */}
          {currentCoverUrl ? (
            <img
              src={currentCoverUrl}
              alt="Cover Preview"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900" />
          )}

          {/* Dark scrim gradient to make book typography legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/60 z-10" />

          {/* Front Cover Embossed Details */}
          <div className="relative z-10 p-2.5 flex flex-col justify-between h-full text-white select-none">
            {/* Top Category Stamp */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300/90 bg-black/40 px-1.5 py-0.5 rounded-md backdrop-blur-xs line-clamp-1">
                {category || 'Daily Diary'}
              </span>
              <BookOpen className="w-3 h-3 text-amber-300/70" />
            </div>

            {/* Middle / Bottom Title & Author */}
            <div className="space-y-1">
              <div className="h-0.5 w-6 bg-amber-400/80 rounded-full" />
              <h5 className="text-[12px] font-black leading-tight line-clamp-2 text-amber-50 drop-shadow-md">
                {title.trim() || 'Untitled Diary'}
              </h5>
              <p className="text-[10px] text-amber-200/80 font-medium line-clamp-1">
                by {author || 'Creator'}
              </p>
            </div>
          </div>

          {/* Remove button on hover */}
          {currentCoverUrl && (
            <button
              type="button"
              onClick={handleRemoveCover}
              className="absolute top-2 right-2 z-30 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
              title="Remove Cover Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls and Tabs */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Diary Cover Appearance
              </label>
              {currentCoverUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Reset to Default
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Choose an aesthetic preset, upload your own photo, or paste any image link.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Aesthetic Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5 text-cyan-600" />
              <span>Image URL</span>
            </button>
          </div>

          {/* Tab 1: Presets Grid */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 py-1">
              {PRESET_DIARY_COVERS.map((preset) => {
                const isSelected = currentCoverUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.url)}
                    className={`group relative h-20 rounded-xl overflow-hidden border-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-95 shadow-md'
                        : 'border-gray-200 hover:border-gray-400 hover:scale-[0.98]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 flex flex-col justify-end text-white">
                      <span className="text-[10px] font-bold line-clamp-1 leading-tight">
                        {preset.name}
                      </span>
                      <span className="text-[8px] text-gray-300 line-clamp-1">{preset.vibe}</span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-1 right-1 p-0.5 bg-indigo-600 text-white rounded-full shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Upload Device Photo */}
          {activeTab === 'upload' && (
            <div className="p-4 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-2xl bg-white text-center transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading to cloud...' : 'Click to choose cover photo'}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    JPG, PNG, WebP up to 15MB. Automatically cropped & optimized.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Paste Image URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyUrl} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or any image link"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                Paste any direct image link from Unsplash, Pexels, or your web storage.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryCoverPicker;
