import { useState } from 'react';
import {
  Menu,
  Lock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  MapPin,
  Smile,
  CloudSun,
  Clock,
  ArrowRight,
  CreditCard,
  Plus,
  Edit3,
  Image as ImageIcon,
  Film,
  Play,
  Share2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import ViewChapterSidebar from './ViewChapterSidebar';
import LogEntryModal from '../models/LogEntryModal';
import { loadRazorpayScript } from '../../utils/razorpay';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

// Video embed/player helper
const VideoEmbed = ({ url }) => {
  if (!url) return null;

  // YouTube match
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="Video Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // Direct video (Cloudinary, MP4, WebM, MOV)
  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-black">
      <video controls playsInline className="w-full max-h-[460px] object-contain">
        <source src={url} />
        Your browser does not support playing this video.
      </video>
    </div>
  );
};

const ViewBook = ({ book, onReload }) => {
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState(17);
  const [isPaying, setIsPaying] = useState(false);

  // Log Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);

  // Fullscreen photo modal
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const chapters = book.chapters || [];
  const selectedChapter = chapters[selectedChapterIndex] || {
    title: 'No memory logged yet',
    content: '',
  };

  const isCurrentChapterLocked = selectedChapter.isLocked;
  const isOwner = book.isOwner || (user?._id && book.userId === user._id);

  // Format content paragraphs
  const formatContent = (content = '') => {
    return content
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => {
        let paragraph = p.trim();
        paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        paragraph = paragraph.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>');
        return `<p class="mb-4 leading-relaxed">${paragraph}</p>`;
      })
      .join('');
  };

  // Open entry editor
  const handleOpenAddEntry = () => {
    setEntryToEdit(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditEntry = () => {
    setEntryToEdit(selectedChapter);
    setIsEntryModalOpen(true);
  };

  // Razorpay Checkout Handler
  const handleUnlockDiary = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in with your email to unlock this diary.');
      navigate('/login');
      return;
    }

    setIsPaying(true);
    try {
      const orderRes = await axiosInstance.post(API_PATHS.PAYMENT.CREATE_ORDER, {
        diaryId: book._id,
      });

      const orderData = orderRes.data?.data;

      if (orderData.alreadyUnlocked) {
        toast.success('Diary is already unlocked!');
        if (onReload) onReload();
        setIsPaying(false);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded && !orderData.isDemoMode) {
        toast.error('Failed to load Razorpay payment SDK.');
        setIsPaying(false);
        return;
      }

      // Demo sandbox fallback
      if (orderData.isDemoMode || !window.Razorpay) {
        const confirmDemo = window.confirm(
          `[Razorpay Sandbox Mode]\nUnlock "${book.title}" for ₹${book.price}?\n\n(Live Gateway triggers when RAZORPAY_KEY_ID is active).`
        );

        if (!confirmDemo) {
          setIsPaying(false);
          return;
        }

        const verifyRes = await axiosInstance.post(API_PATHS.PAYMENT.VERIFY_PAYMENT, {
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_valid_signature',
          diaryId: book._id,
        });

        toast.success(verifyRes.data?.message || 'Payment verified! Diary unlocked.');
        if (onReload) onReload();
        setIsPaying(false);
        return;
      }

      // Live Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'LifeLog Daily Diary',
        description: `Unlock all life entries of "${book.title}" by ${book.author}`,
        order_id: orderData.orderId,
        image: book.coverImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        handler: async (response) => {
          try {
            const verifyRes = await axiosInstance.post(API_PATHS.PAYMENT.VERIFY_PAYMENT, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              diaryId: book._id,
            });

            toast.success(verifyRes.data?.message || 'Payment verified! Diary unlocked.');
            if (onReload) onReload();
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            toast('Payment cancelled.', { icon: 'ℹ️' });
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error(error.response?.data?.message || 'Could not initiate payment.');
      setIsPaying(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Drawer */}
      <ViewChapterSidebar
        book={book}
        selectedChapterIndex={selectedChapterIndex}
        onSelectChapter={setSelectedChapterIndex}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUnlockClick={handleUnlockDiary}
        onAddEntryClick={isOwner ? handleOpenAddEntry : null}
      />

      {/* Main Reading & Life Stream Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white/90 backdrop-blur-md z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-gray-900 truncate max-w-[180px] sm:max-w-md">
                  {book.title}
                </h1>
                {book.isUnlocked ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : book.isPremium ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                    <Lock className="w-3 h-3" /> ₹{book.price}
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                    Free
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">by {book.author}</p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {isOwner && (
              <>
                <Button
                  onClick={handleOpenAddEntry}
                  icon={Plus}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs"
                >
                  Log Entry
                </Button>
                <button
                  onClick={handleOpenEditEntry}
                  className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1 border border-gray-200"
                  title="Edit current memory"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </>
            )}

            {!book.isUnlocked && book.isPremium && (
              <Button
                onClick={handleUnlockDiary}
                isLoading={isPaying}
                icon={CreditCard}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md"
              >
                Unlock ₹{book.price}
              </Button>
            )}

            <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs font-semibold text-gray-700">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2 py-1 rounded-lg hover:bg-white"
              >
                A-
              </button>
              <span className="px-1.5">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="px-2 py-1 rounded-lg hover:bg-white"
              >
                A+
              </button>
            </div>
          </div>
        </header>

        {/* Life Stream Content Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 space-y-8">
            {/* Diary Entry Header: Date & Mood Ribbon */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-200/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 text-xs text-gray-500">
                {/* Date & Time */}
                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>
                    {selectedChapter.date
                      ? new Date(selectedChapter.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Date not set'}
                  </span>
                  {selectedChapter.timeOfDay && (
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[11px] font-semibold text-gray-600">
                      {selectedChapter.timeOfDay}
                    </span>
                  )}
                </div>

                {/* Mood, Weather & Location Badges */}
                <div className="flex items-center gap-2">
                  {selectedChapter.weather && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <CloudSun className="w-3.5 h-3.5" />
                      {selectedChapter.weather}
                    </span>
                  )}
                  {selectedChapter.mood && (
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <Smile className="w-3.5 h-3.5" />
                      {selectedChapter.mood}
                    </span>
                  )}
                </div>
              </div>

              {selectedChapter.location && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{selectedChapter.location}</span>
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                {selectedChapter.title}
              </h2>

              {selectedChapter.description && (
                <p className="text-sm text-gray-500 italic">"{selectedChapter.description}"</p>
              )}
            </div>

            {/* Locked vs Unlocked View */}
            {isCurrentChapterLocked ? (
              /* Paywall Card */
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-8 sm:p-12 shadow-2xl border border-white/10 text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25">
                  <Lock className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Follow {book.author}'s Real Life Diary
                  </h3>
                  <p className="text-purple-200/80 text-sm leading-relaxed">
                    This daily memory contains candid thoughts
                    {selectedChapter.photosCount > 0
                      ? `, ${selectedChapter.photosCount} photos`
                      : ''}
                    {selectedChapter.videosCount > 0
                      ? ` and ${selectedChapter.videosCount} video clips`
                      : ''}
                    . Unlock full lifetime access to this entire diary.
                  </p>
                </div>

                {/* Features */}
                <div className="grid sm:grid-cols-3 gap-3 text-left max-w-md mx-auto pt-2">
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs">
                    <div className="font-bold text-white mb-1">Ongoing Life Stream</div>
                    <div className="text-purple-200 text-[11px]">
                      Read all past and future days as they are written
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs">
                    <div className="font-bold text-white mb-1">Photos & Video Clips</div>
                    <div className="text-purple-200 text-[11px]">
                      Full multimedia memory gallery unlocked
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-xs">
                    <div className="font-bold text-white mb-1">Support Creator</div>
                    <div className="text-purple-200 text-[11px]">
                      Direct 1-time support via Razorpay
                    </div>
                  </div>
                </div>

                <div className="pt-4 max-w-sm mx-auto space-y-3">
                  <Button
                    onClick={handleUnlockDiary}
                    isLoading={isPaying}
                    icon={CreditCard}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02]"
                  >
                    Unlock for ₹{book.price} via Razorpay
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-xs text-purple-200/60">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Secured with Razorpay 256-bit encryption</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Unlocked Content Area */
              <div className="space-y-8">
                {/* Written Diary Story */}
                <article
                  className="prose prose-lg max-w-none text-gray-800 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs"
                  style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatContent(
                      selectedChapter.content || 'No text written for this memory yet.'
                    ),
                  }}
                />

                {/* Photo Gallery (if photos attached to this memory) */}
                {selectedChapter.photos && selectedChapter.photos.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>Photos from this day ({selectedChapter.photos.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedChapter.photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setActivePhotoModal(photoUrl)}
                          className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 cursor-pointer border border-gray-200 shadow-xs"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded-lg">
                              View
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Clips (if video clips attached to this memory) */}
                {selectedChapter.videos && selectedChapter.videos.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-sm font-black text-gray-900">
                      <Film className="w-4 h-4 text-purple-600" />
                      <span>Video Vlogs & Clips ({selectedChapter.videos.length})</span>
                    </div>

                    <div className="space-y-4">
                      {selectedChapter.videos.map((vidUrl, vIdx) => (
                        <VideoEmbed key={vIdx} url={vidUrl} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Day Navigation */}
            <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
              <button
                disabled={selectedChapterIndex === 0}
                onClick={() => setSelectedChapterIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Earlier Memory
              </button>

              <span className="text-xs font-semibold text-gray-400">
                Memory {selectedChapterIndex + 1} of {chapters.length}
              </span>

              <button
                disabled={selectedChapterIndex >= chapters.length - 1}
                onClick={() =>
                  setSelectedChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1))
                }
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                Next Memory →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Log / Edit Entry Modal */}
      <LogEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        diaryId={book._id}
        existingEntry={entryToEdit}
        onEntrySaved={() => {
          if (onReload) onReload();
        }}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setActivePhotoModal(null)}
        >
          <img
            src={activePhotoModal}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ViewBook;
