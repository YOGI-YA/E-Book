import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Smile,
  CloudSun,
  MapPin,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Save,
  X,
  Play,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import toast from 'react-hot-toast';

const MOODS = [
  { label: 'Reflective', emoji: '💭' },
  { label: 'Happy', emoji: '😊' },
  { label: 'Candid', emoji: '☕' },
  { label: 'Adventurous', emoji: '🏔️' },
  { label: 'Peaceful', emoji: '🌿' },
  { label: 'Grateful', emoji: '🙏' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Motivated', emoji: '⚡' },
];

const WEATHERS = [
  { label: 'Sunny', emoji: '☀️' },
  { label: 'Rainy', emoji: '🌧️' },
  { label: 'Cloudy', emoji: '⛅' },
  { label: 'Cold', emoji: '❄️' },
  { label: 'Breezy', emoji: '🍃' },
];

const TIMES = [
  { label: 'Morning', emoji: '🌅' },
  { label: 'Afternoon', emoji: '☀️' },
  { label: 'Evening', emoji: '🌆' },
  { label: 'Late Night', emoji: '🌙' },
];

const LogEntryModal = ({ isOpen, onClose, diaryId, existingEntry, onEntrySaved }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeOfDay, setTimeOfDay] = useState('Evening');
  const [mood, setMood] = useState('Reflective');
  const [weather, setWeather] = useState('Sunny');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);

  // Inputs & states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [showPhotoUrlBox, setShowPhotoUrlBox] = useState(false);
  const [showVideoUrlBox, setShowVideoUrlBox] = useState(false);

  const photoFileRef = useRef(null);
  const videoFileRef = useRef(null);

  // Populate if editing
  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setDate(
        existingEntry.date
          ? new Date(existingEntry.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setTimeOfDay(existingEntry.timeOfDay || 'Evening');
      setMood(existingEntry.mood || 'Reflective');
      setWeather(existingEntry.weather || 'Sunny');
      setLocation(existingEntry.location || '');
      setContent(existingEntry.content || '');
      setPhotos(Array.isArray(existingEntry.photos) ? existingEntry.photos : []);
      setVideos(Array.isArray(existingEntry.videos) ? existingEntry.videos : []);
    } else {
      resetForm();
    }
  }, [existingEntry, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setTimeOfDay('Evening');
    setMood('Reflective');
    setWeather('Sunny');
    setLocation('');
    setContent('');
    setPhotos([]);
    setVideos([]);
    setShowPhotoUrlBox(false);
    setShowVideoUrlBox(false);
    setPhotoUrlInput('');
    setVideoUrlInput('');
  };

  // Upload photo file to Cloudinary
  const handlePhotoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new window.FormData();
    formData.append('media', file);

    setIsUploadingPhoto(true);
    try {
      const res = await axiosInstance.post(API_PATHS.DIARIES.UPLOAD_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setPhotos((prev) => [...prev, uploadedUrl]);
        toast.success('Photo uploaded to diary entry!');
      }
    } catch (err) {
      console.error('Photo upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload video clip file to Cloudinary
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new window.FormData();
    formData.append('media', file);

    setIsUploadingVideo(true);
    try {
      const res = await axiosInstance.post(API_PATHS.DIARIES.UPLOAD_MEDIA, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setVideos((prev) => [...prev, uploadedUrl]);
        toast.success('Video clip uploaded to diary entry!');
      }
    } catch (err) {
      console.error('Video upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload video clip');
    } finally {
      setIsUploadingVideo(false);
      if (e.target) e.target.value = '';
    }
  };

  // Add photo from URL
  const handleAddPhotoUrl = () => {
    if (!photoUrlInput.trim()) return;
    setPhotos((prev) => [...prev, photoUrlInput.trim()]);
    setPhotoUrlInput('');
    setShowPhotoUrlBox(false);
  };

  // Add video from URL
  const handleAddVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    setVideos((prev) => [...prev, videoUrlInput.trim()]);
    setVideoUrlInput('');
    setShowVideoUrlBox(false);
  };

  // Remove media
  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // AI Assistant: Expand/Polish notes into a diary entry
  const handleAiAssist = async () => {
    if (!content.trim() && !title.trim()) {
      toast.error('Jot down a few bullet points or words first for AI to polish!');
      return;
    }

    setIsAiGenerating(true);
    try {
      const res = await axiosInstance.post(API_PATHS.AI.GENERATE_CHAPTER_CONTENT, {
        chapterTitle: title.trim() || `Daily Life Entry for ${date}`,
        chapterDescription: `Mood: ${mood}, Weather: ${weather}, Location: ${location || 'Everyday life'}`,
        style: mood,
        notes: content.trim(),
      });

      const generated = res.data?.data?.content;
      if (generated) {
        setContent(generated);
        toast.success('Refined into a personal diary entry!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI assistant unavailable');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save Entry (Create or Update)
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const entryPayload = {
      title: title.trim() || `Memory for ${new Date(date).toLocaleDateString()}`,
      date: new Date(date),
      timeOfDay,
      mood,
      weather,
      location: location.trim(),
      content: content.trim(),
      photos,
      videos,
    };

    setIsSaving(true);
    try {
      if (existingEntry && existingEntry._id) {
        // Update existing entry
        await axiosInstance.put(
          `${API_PATHS.DIARIES.ENTRY}/${diaryId}/entry/${existingEntry._id}`,
          entryPayload
        );
        toast.success('Diary entry updated!');
      } else {
        // Add new entry
        await axiosInstance.post(`${API_PATHS.DIARIES.ENTRY}/${diaryId}/entry`, entryPayload);
        toast.success('New daily memory logged in your diary!');
      }

      if (onEntrySaved) onEntrySaved();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Save entry failed:', err);
      toast.error(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={existingEntry ? 'Edit Diary Entry' : 'Log Daily Memory / Life Vlog'}
    >
      <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {/* Date, Time, Mood & Weather bar */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Time
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TIMES.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.emoji} {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Mood
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MOODS.map((m) => (
                  <option key={m.label} value={m.label}>
                    {m.emoji} {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Weather
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {WEATHERS.map((w) => (
                  <option key={w.label} value={w.label}>
                    {w.emoji} {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Add location (e.g. Goa Beach Shack, Home Desk, Mumbai Metro)..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Entry Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Entry Title <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Midnight coffee and a quiet victory, Day 14 of solo journey..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Written Thoughts / Diary Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700">
              What happened today? Your Thoughts & Memories
            </label>
            <button
              type="button"
              onClick={handleAiAssist}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>{isAiGenerating ? 'AI Polishing...' : 'AI Assist'}</span>
            </button>
          </div>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write as little or as much as you want. There is no word limit. Capture your real emotions, encounters, and feelings like a diary..."
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-800 leading-relaxed outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* Photos Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>Photos ({photos.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={photoFileRef}
                accept="image/*"
                onChange={handlePhotoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoFileRef.current?.click()}
                disabled={isUploadingPhoto}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>{isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPhotoUrlBox(!showPhotoUrlBox)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Photo URL</span>
              </button>
            </div>
          </div>

          {showPhotoUrlBox && (
            <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="url"
                placeholder="Paste image link (https://...)"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddPhotoUrl}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
              >
                Add
              </button>
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden h-24 border border-gray-200 bg-gray-100"
                >
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
              <VideoIcon className="w-4 h-4 text-purple-600" />
              <span>Video Clips ({videos.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={videoFileRef}
                accept="video/*"
                onChange={handleVideoFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoFileRef.current?.click()}
                disabled={isUploadingVideo}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>{isUploadingVideo ? 'Uploading...' : 'Upload Clip'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVideoUrlBox(!showVideoUrlBox)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Video URL</span>
              </button>
            </div>
          </div>

          {showVideoUrlBox && (
            <div className="flex gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="url"
                placeholder="Paste video URL (YouTube, Vimeo, MP4, Cloudinary)..."
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg outline-none"
              />
              <button
                type="button"
                onClick={handleAddVideoUrl}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg"
              >
                Add
              </button>
            </div>
          )}

          {videos.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {videos.map((vid, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-purple-50/60 rounded-xl border border-purple-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Play className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="truncate text-gray-700 font-medium">{vid}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Actions */}
        <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} className="rounded-xl text-xs py-2 px-4">
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSaving}
            icon={Save}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl shadow-md"
          >
            {existingEntry ? 'Update Memory' : 'Save to Life Diary'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogEntryModal;
