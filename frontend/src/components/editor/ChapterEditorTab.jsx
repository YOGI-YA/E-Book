import { useMemo, useState, useRef } from 'react';
import {
  Sparkle,
  Type,
  Maximize2,
  Calendar,
  Smile,
  CloudSun,
  MapPin,
  Image as ImageIcon,
  Video as VideoIcon,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
import SimpleMDEditor from './SimpleMDEditor';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';

const MOODS = [
  'Reflective',
  'Happy',
  'Candid',
  'Adventurous',
  'Peaceful',
  'Grateful',
  'Tired',
  'Motivated',
];
const WEATHERS = ['Sunny', 'Rainy', 'Cloudy', 'Cold', 'Breezy'];
const TIMES = ['Morning', 'Afternoon', 'Evening', 'Late Night'];

const ChapterEditorTab = ({
  book = { title: 'Untitled', chapters: [{ title: 'Day 1', content: '' }] },
  selectedChapterIndex = 0,
  onChapterChange = () => {},
  onGenerateChapterContent = () => {},
  isGenerating,
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showPhotoBox, setShowPhotoBox] = useState(false);
  const [showVideoBox, setShowVideoBox] = useState(false);

  const fileInputRef = useRef(null);
  const currentChapter = book.chapters[selectedChapterIndex];

  // Markdown Formatter for Preview
  const formatMarkdown = (content = '') => {
    return content
      .replace(/^###\s+(.*)/gm, '<h3 class="text-xl font-bold mb-4 mt-6">$1</h3>')
      .replace(/^##\s+(.*)/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
      .replace(/^#\s+(.*)/gm, '<h1 class="text-3xl font-bold mb-6 mt-8">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n\n')
      .map((p) => `<p class="mb-4 leading-relaxed">${p}</p>`)
      .join('');
  };

  const mdeOptions = useMemo(
    () => ({
      autofocus: true,
      spellChecker: false,
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        'preview',
      ],
    }),
    []
  );

  if (!currentChapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Type className="w-10 h-10 mb-3 text-gray-400" />
        <p>Select or create a daily memory to start writing</p>
      </div>
    );
  }

  // Handle Photo File Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new window.FormData();
    formData.append('media', file);

    setIsUploadingMedia(true);
    try {
      const res = await axiosInstance.post(API_PATHS.DIARIES.UPLOAD_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        const updatedPhotos = [...(currentChapter.photos || []), url];
        onChapterChange({ target: { name: 'photos', value: updatedPhotos } });
        toast.success('Photo added to this entry!');
      }
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add Photo URL
  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    const updated = [...(currentChapter.photos || []), photoUrlInput.trim()];
    onChapterChange({ target: { name: 'photos', value: updated } });
    setPhotoUrlInput('');
    setShowPhotoBox(false);
  };

  // Add Video URL
  const handleAddVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    const updated = [...(currentChapter.videos || []), videoUrlInput.trim()];
    onChapterChange({ target: { name: 'videos', value: updated } });
    setVideoUrlInput('');
    setShowVideoBox(false);
  };

  const handleRemovePhoto = (index) => {
    const updated = (currentChapter.photos || []).filter((_, i) => i !== index);
    onChapterChange({ target: { name: 'photos', value: updated } });
  };

  const handleRemoveVideo = (index) => {
    const updated = (currentChapter.videos || []).filter((_, i) => i !== index);
    onChapterChange({ target: { name: 'videos', value: updated } });
  };

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 bg-white z-50 p-6 overflow-y-auto' : 'flex-1 p-6'} flex flex-col space-y-5`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-3 gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Day & Memory Editor</h1>
          <p className="text-xs text-gray-500">
            Editing: {currentChapter.title || `Entry ${selectedChapterIndex + 1}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewMode(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isPreviewMode ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            Edit
          </button>

          <button
            onClick={() => setIsPreviewMode(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isPreviewMode ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            Preview
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-600"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <Button
            onClick={() => onGenerateChapterContent(selectedChapterIndex)}
            isLoading={isGenerating === selectedChapterIndex}
            icon={Sparkle}
            size="sm"
            className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            AI Polish
          </Button>
        </div>
      </div>

      {/* Date, Mood, Weather & Location Controls */}
      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={
                currentChapter.date
                  ? new Date(currentChapter.date).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              onChange={onChapterChange}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Time of Day
            </label>
            <select
              name="timeOfDay"
              value={currentChapter.timeOfDay || 'Evening'}
              onChange={onChapterChange}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Mood
            </label>
            <select
              name="mood"
              value={currentChapter.mood || 'Reflective'}
              onChange={onChapterChange}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Weather
            </label>
            <select
              name="weather"
              value={currentChapter.weather || 'Sunny'}
              onChange={onChapterChange}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {WEATHERS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-xl">
          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
          <input
            type="text"
            name="location"
            value={currentChapter.location || ''}
            onChange={onChapterChange}
            placeholder="Location of this memory (e.g. Manali Cafe, Home Desk)..."
            className="w-full text-xs text-gray-800 outline-none font-medium placeholder-gray-400"
          />
        </div>
      </div>

      {/* Entry Title */}
      <InputField
        label="Memory Title"
        name="title"
        value={currentChapter.title || ''}
        onChange={onChapterChange}
        placeholder="e.g. Day 4: Morning mist and coffee conversations..."
        className="text-base font-bold"
      />

      {/* Photos & Videos Strip */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>
              Photos & Videos Attached (
              {(currentChapter.photos?.length || 0) + (currentChapter.videos?.length || 0)})
            </span>
          </span>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingMedia}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploadingMedia ? 'Uploading...' : 'Upload File'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPhotoBox(!showPhotoBox)}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Photo Link</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVideoBox(!showVideoBox)}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Video Link</span>
            </button>
          </div>
        </div>

        {showPhotoBox && (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={photoUrlInput}
              onChange={(e) => setPhotoUrlInput(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none"
            />
            <button
              onClick={handleAddPhotoUrl}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
            >
              Add Photo
            </button>
          </div>
        )}

        {showVideoBox && (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste YouTube, Vimeo or MP4 URL..."
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none"
            />
            <button
              onClick={handleAddVideoUrl}
              className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl"
            >
              Add Video
            </button>
          </div>
        )}

        {/* Media Thumbnails */}
        {((currentChapter.photos && currentChapter.photos.length > 0) ||
          (currentChapter.videos && currentChapter.videos.length > 0)) && (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {currentChapter.photos?.map((url, idx) => (
              <div
                key={idx}
                className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
              >
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {currentChapter.videos?.map((vUrl, vIdx) => (
              <div
                key={vIdx}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-900"
              >
                <VideoIcon className="w-3.5 h-3.5 text-purple-600" />
                <span className="max-w-[120px] truncate">{vUrl}</span>
                <button
                  onClick={() => handleRemoveVideo(vIdx)}
                  className="text-red-500 hover:text-red-700 ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div className="flex-1">
        {isPreviewMode ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-2xl font-black text-gray-900">
              {currentChapter.title || 'Untitled Memory'}
            </h2>
            <div
              className="prose max-w-none text-gray-800 leading-relaxed text-sm"
              dangerouslySetInnerHTML={{
                __html: currentChapter.content
                  ? formatMarkdown(currentChapter.content)
                  : '<p class="text-gray-400 italic">No thoughts written for this day yet.</p>',
              }}
            />
          </div>
        ) : (
          <SimpleMDEditor
            value={currentChapter.content || ''}
            onChange={(value) => onChapterChange({ target: { name: 'content', value } })}
            options={mdeOptions}
          />
        )}
      </div>
    </div>
  );
};

export default ChapterEditorTab;
