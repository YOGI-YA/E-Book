import { useState, useMemo } from 'react';
import {
  Menu,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  MapPin,
  Smile,
  CloudSun,
  Clock,
  Plus,
  Edit3,
  Image as ImageIcon,
  Share2,
  Zap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import ViewChapterSidebar from './ViewChapterSidebar';
import LogEntryModal from '../models/LogEntryModal';
import SubscriptionCheckoutModal from '../models/SubscriptionCheckoutModal';
import { loadRazorpayScript } from '../../utils/razorpay';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPath';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

// Video embed/player helper
const VideoEmbed = ({ url }) => {
  if (!url) return null;

  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-md border border-stone-300">
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

  return (
    <div className="rounded-xl overflow-hidden shadow-md border border-stone-300 bg-black">
      <video controls playsInline className="w-full max-h-[280px] object-contain">
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

  // Selected subscription plan type ('weekly', 'monthly', 'annual')
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Log Entry Modal (For creator)
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

  // Creator-defined plans
  const plans = book.plans || {
    weekly: { enabled: true, price: 49 },
    monthly: { enabled: true, price: book.price || 149 },
    annual: { enabled: true, price: 899 },
  };

  const currentPlan = plans[selectedPlanType] ||
    plans.monthly || { enabled: true, price: book.price || 149 };

  // Calculate word and character count
  const wordCount = useMemo(() => {
    if (!selectedChapter.content) return 0;
    return selectedChapter.content.trim().split(/\s+/).filter(Boolean).length;
  }, [selectedChapter.content]);

  const charCount = useMemo(() => {
    return selectedChapter.content?.length || 0;
  }, [selectedChapter.content]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 180));
  }, [wordCount]);

  // Format content paragraphs
  const formatContent = (content = '') => {
    return content
      .replace(/^###\s+(.*)/gm, '<h3 class="text-base font-bold mb-2 mt-4 text-stone-900">$1</h3>')
      .replace(/^##\s+(.*)/gm, '<h2 class="text-lg font-bold mb-2 mt-5 text-stone-900">$1</h2>')
      .replace(/^#\s+(.*)/gm, '<h1 class="text-xl font-bold mb-3 mt-5 text-stone-900">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /^>\s+(.*)/gm,
        '<blockquote class="border-l-4 border-amber-600 pl-3 italic my-3 text-stone-700">$1</blockquote>'
      )
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => `<p class="mb-4 leading-relaxed">${p}</p>`)
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

  // Razorpay Subscription Checkout Handler
  const handleUnlockDiary = async (planTypeOverride) => {
    const planToBuy = planTypeOverride || selectedPlanType || 'monthly';

    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe to this diary.');
      navigate('/login');
      return;
    }

    setIsPaying(true);
    try {
      const orderRes = await axiosInstance.post(API_PATHS.PAYMENT.CREATE_ORDER, {
        diaryId: book._id,
        planType: planToBuy,
      });

      const orderData = orderRes.data?.data;

      if (orderData.alreadyUnlocked) {
        toast.success(orderRes.data?.message || 'Diary is already unlocked!');
        setIsCheckoutModalOpen(false);
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

      // Demo sandbox fallback if keys are missing or test mode
      if (orderData.isDemoMode || !window.Razorpay) {
        const confirmDemo = window.confirm(
          `[Razorpay Sandbox Mode]\nSubscribe to "${book.title}" (${planToBuy.toUpperCase()} Pass) for ₹${orderData.price || currentPlan.price}?\n\n(Live Gateway triggers when RAZORPAY_KEY_ID is active).`
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
          planType: planToBuy,
        });

        toast.success(verifyRes.data?.message || 'Subscription active! Diary unlocked.');
        setIsCheckoutModalOpen(false);
        if (onReload) onReload();
        setIsPaying(false);
        return;
      }

      // Live Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'LifeLog Personal Diary Subscription',
        description: `${planToBuy.toUpperCase()} Access to "${book.title}" by ${book.author}`,
        order_id: orderData.orderId,
        image: book.coverImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        handler: async (response) => {
          try {
            const verifyRes = await axiosInstance.post(API_PATHS.PAYMENT.VERIFY_PAYMENT, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              diaryId: book._id,
              planType: planToBuy,
            });

            toast.success(verifyRes.data?.message || 'Subscription verified! Diary unlocked.');
            setIsCheckoutModalOpen(false);
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
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Could not initiate subscription.');
      setIsPaying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${selectedChapter.title} - ${book.title}`,
        text: `Read this memory from "${book.title}" by ${book.author}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex h-screen bg-[#f3efe6] overflow-hidden">
      {/* Sidebar Drawer */}
      <ViewChapterSidebar
        book={book}
        selectedChapterIndex={selectedChapterIndex}
        onSelectChapter={setSelectedChapterIndex}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onUnlockClick={() => setIsCheckoutModalOpen(true)}
        onAddEntryClick={isOwner ? handleOpenAddEntry : null}
      />

      {/* Main Reading Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-[#ded7c8] bg-[#fdfcf7]/90 backdrop-blur-md z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-200/60"
              title="Table of Contents"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black font-serif text-stone-900 truncate max-w-[170px] sm:max-w-md">
                  {book.title}
                </h1>
                {book.subscription?.isActive ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Subscribed ({book.subscription.planType})
                  </span>
                ) : book.isUnlocked ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Full Access
                  </span>
                ) : book.accessType === 'paid' || book.isPremium ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                    <Lock className="w-3 h-3 text-indigo-600" /> Subscription Diary
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                    Free
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-serif">by {book.author}</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button
                  onClick={handleOpenAddEntry}
                  icon={Plus}
                  className="bg-stone-800 hover:bg-stone-900 text-amber-50 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs"
                >
                  Write Entry
                </Button>
                <button
                  onClick={handleOpenEditEntry}
                  className="p-2 rounded-xl text-stone-600 hover:bg-stone-200/60 text-xs font-semibold flex items-center gap-1 border border-stone-300"
                  title="Edit current memory"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </>
            )}

            {!book.isUnlocked && (book.accessType === 'paid' || book.isPremium) && (
              <Button
                onClick={() => setIsCheckoutModalOpen(true)}
                icon={Zap}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1"
              >
                <span>Subscribe (₹{plans.weekly?.price || plans.monthly?.price || 49})</span>
              </Button>
            )}

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-[#eae3d5] rounded-xl p-0.5 text-xs font-semibold text-stone-700">
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="px-2 py-1 rounded-lg hover:bg-white/80 transition-colors"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="px-1.5 text-[11px] font-mono">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                className="px-2 py-1 rounded-lg hover:bg-white/80 transition-colors"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-stone-600 hover:bg-stone-200/60 transition-colors"
              title="Share this memory"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="w-full max-w-6xl mx-auto space-y-4">
            {/* Free Preview Banner */}
            {selectedChapter.isPreview && !book.isUnlocked && (
              <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-stone-900 font-semibold font-serif">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Free Preview Memory {selectedChapterIndex + 1} of {book.freePreviewEntries || 2}{' '}
                    • Subscribe to read all daily memories by {book.author}.
                  </span>
                </div>
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="px-3 py-1 bg-stone-900 hover:bg-black text-amber-300 font-bold rounded-xl flex-shrink-0 transition-colors text-xs"
                >
                  Subscribe
                </button>
              </div>
            )}

            {/* =========================================================================
                DESKTOP & TABLET: THE AUTHENTIC TWO-FACE OPEN BOOK SPREAD (md: and above)
               ========================================================================= */}
            <div className="hidden md:block">
              {/* Leather Hardcover Journal Frame */}
              <div className="relative book-leather-binding rounded-[28px] p-4 sm:p-5 shadow-2xl">
                {/* Subtle Outer Embossed Book Border */}
                <div className="border border-[#5a4336] rounded-[22px] p-2 bg-[#201813]">
                  {/* The Two Pages Spread */}
                  <div className="relative grid grid-cols-2 rounded-2xl overflow-hidden min-h-[660px] bg-[#fbf9f2] book-shadow">
                    {/* Central Spine Fold Shadow */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 pointer-events-none z-20 book-spine-crease" />

                    {/* Crimson Satin Bookmark Ribbon hanging down center */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-36 z-30 pointer-events-none satin-ribbon">
                      <div className="absolute -bottom-2.5 left-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-[#7f1d1d]" />
                    </div>

                    {/* -------------------------------------------------------------
                        LEFT PAGE: PAGE 1 - Memory Details & Scrapbook Keepsakes
                       ------------------------------------------------------------- */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between border-r border-[#e8e2d5] bg-[#fdfcf7] book-page-paper relative">
                      <div className="space-y-4">
                        {/* Page 1 Header: Date, Mood & Weather Stamps */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#e8e2d5] text-xs">
                          {/* Date Stamp */}
                          <div className="flex items-center gap-1.5 bg-[#f5f0e6] px-2.5 py-1 rounded-lg border border-[#e2d9ca]">
                            <Calendar className="w-3.5 h-3.5 text-stone-600" />
                            <span className="font-serif text-xs font-bold text-stone-800">
                              {selectedChapter.date
                                ? new Date(selectedChapter.date).toISOString().split('T')[0]
                                : 'Undated'}
                            </span>
                          </div>

                          {/* Time of Day */}
                          {selectedChapter.timeOfDay && (
                            <div className="bg-[#f5f0e6] px-2 py-1 rounded-lg border border-[#e2d9ca] text-xs font-serif font-bold text-stone-700">
                              {selectedChapter.timeOfDay}
                            </div>
                          )}

                          {/* Mood Stamp */}
                          {selectedChapter.mood && (
                            <div className="flex items-center gap-1 bg-[#f5f0e6] px-2 py-1 rounded-lg border border-[#e2d9ca]">
                              <Smile className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-xs font-serif font-bold text-stone-800">
                                {selectedChapter.mood}
                              </span>
                            </div>
                          )}

                          {/* Weather Stamp */}
                          {selectedChapter.weather && (
                            <div className="flex items-center gap-1 bg-[#f5f0e6] px-2 py-1 rounded-lg border border-[#e2d9ca]">
                              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-xs font-serif font-bold text-stone-800">
                                {selectedChapter.weather}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Location Stamp */}
                        {selectedChapter.location && (
                          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                            <span className="text-xs font-serif font-medium text-stone-800">
                              {selectedChapter.location}
                            </span>
                          </div>
                        )}

                        {/* Memory Title */}
                        <div>
                          <label className="block text-[10px] font-serif font-bold text-stone-400 uppercase tracking-widest mb-1">
                            Entry Title
                          </label>
                          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight leading-snug">
                            {selectedChapter.title || 'Untitled Memory'}
                          </h2>
                          {selectedChapter.description && (
                            <p className="text-xs text-stone-500 font-serif italic mt-1">
                              "{selectedChapter.description}"
                            </p>
                          )}
                        </div>

                        {/* Scrapbook Keepsakes: Attached Photos & Videos */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif font-bold text-stone-800 flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-stone-600" />
                              <span>
                                Scrapbook Keepsakes (
                                {(selectedChapter.photos?.length || 0) +
                                  (selectedChapter.videos?.length || 0)}
                                )
                              </span>
                            </span>
                            <span className="text-[10px] text-stone-400 font-serif">
                              {selectedChapter.photos?.length > 0 && 'Click to zoom'}
                            </span>
                          </div>

                          {/* Polaroid Scrapbook Gallery */}
                          <div className="grid grid-cols-3 gap-2.5 pt-1 max-h-56 overflow-y-auto pr-1">
                            {selectedChapter.photos?.map((photoUrl, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setActivePhotoModal(photoUrl)}
                                className="relative polaroid-frame p-1 rounded-sm border border-stone-200 bg-white cursor-pointer group"
                                title="Click to view full photo"
                              >
                                <div className="aspect-square overflow-hidden bg-stone-100">
                                  <img
                                    src={photoUrl}
                                    alt={`Memory photo ${pIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="h-4 flex items-center justify-between px-1 text-[9px] text-stone-500 font-serif">
                                  <span>Photo #{pIdx + 1}</span>
                                  <Eye className="w-2.5 h-2.5 text-stone-400 group-hover:text-amber-700" />
                                </div>
                              </div>
                            ))}

                            {/* Videos */}
                            {selectedChapter.videos?.map((vidUrl, vIdx) => (
                              <div key={vIdx} className="col-span-3">
                                <VideoEmbed url={vidUrl} />
                              </div>
                            ))}

                            {!selectedChapter.photos?.length && !selectedChapter.videos?.length && (
                              <div className="col-span-3 py-10 border-2 border-dashed border-[#e2d9ca] rounded-xl text-center text-stone-400 font-serif text-xs">
                                No photos or clips pinned to this page yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Left Page Footer */}
                      <div className="pt-4 border-t border-[#e8e2d5] flex items-center justify-between text-[11px] font-serif text-stone-400 select-none">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                          <span>Page {selectedChapterIndex * 2 + 1}</span>
                        </span>
                        <span className="italic">{book.author}'s LifeLog</span>
                      </div>
                    </div>

                    {/* -------------------------------------------------------------
                        RIGHT PAGE: PAGE 2 - The Ruled Journal Writing Sheet
                       ------------------------------------------------------------- */}
                    <div className="p-6 sm:p-8 flex flex-col justify-between bg-[#fcfbf6] book-ruled-lines book-margin-line pl-10 pr-6 relative">
                      <div className="flex-1 flex flex-col">
                        {/* Right Page Header Toolbar */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e8e2d5] text-xs">
                          <div className="flex items-center gap-1 text-stone-500 font-serif">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span className="font-semibold">{readingTime} min read</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-serif font-bold text-stone-600 bg-[#ede6d8] px-2 py-0.5 rounded-md">
                            <span>Entry #{selectedChapterIndex + 1}</span>
                          </div>
                        </div>

                        {/* Content Body: Story or Paywall */}
                        <div className="flex-1 flex flex-col justify-between">
                          {isCurrentChapterLocked ? (
                            /* Authentic Wax-Seal Paywall Spread */
                            <div className="py-8 px-4 text-center space-y-4 my-auto bg-stone-50/80 rounded-2xl border border-stone-200">
                              <div className="w-12 h-12 bg-amber-500 text-stone-950 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Lock className="w-6 h-6 stroke-[2.5]" />
                              </div>

                              <div className="space-y-1">
                                <h3 className="text-xl font-serif font-black text-stone-900">
                                  Private Diary Entry
                                </h3>
                                <p className="text-xs text-stone-600 font-serif max-w-sm mx-auto leading-relaxed">
                                  This daily memory is part of {book.author}’s subscriber stream.
                                  Unlock full text, polaroids, and clips.
                                </p>
                              </div>

                              {/* Mini Plan Cards */}
                              <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-1">
                                {plans.weekly?.enabled && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlanType('weekly')}
                                    className={`p-2 rounded-xl border text-center transition-all ${
                                      selectedPlanType === 'weekly'
                                        ? 'border-indigo-600 bg-indigo-50 font-bold ring-2 ring-indigo-500/20'
                                        : 'border-stone-200 bg-white hover:bg-stone-50'
                                    }`}
                                  >
                                    <div className="text-[10px] text-stone-500">Weekly</div>
                                    <div className="text-sm font-black text-stone-900">
                                      ₹{plans.weekly.price}
                                    </div>
                                  </button>
                                )}

                                {plans.monthly?.enabled && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlanType('monthly')}
                                    className={`p-2 rounded-xl border text-center transition-all relative ${
                                      selectedPlanType === 'monthly'
                                        ? 'border-amber-500 bg-amber-50 font-bold ring-2 ring-amber-500/20'
                                        : 'border-stone-200 bg-white hover:bg-stone-50'
                                    }`}
                                  >
                                    <div className="text-[10px] text-stone-500">Monthly</div>
                                    <div className="text-sm font-black text-stone-900">
                                      ₹{plans.monthly.price}
                                    </div>
                                  </button>
                                )}

                                {plans.annual?.enabled && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPlanType('annual')}
                                    className={`p-2 rounded-xl border text-center transition-all ${
                                      selectedPlanType === 'annual'
                                        ? 'border-emerald-600 bg-emerald-50 font-bold ring-2 ring-emerald-500/20'
                                        : 'border-stone-200 bg-white hover:bg-stone-50'
                                    }`}
                                  >
                                    <div className="text-[10px] text-stone-500">Annual</div>
                                    <div className="text-sm font-black text-stone-900">
                                      ₹{plans.annual.price}
                                    </div>
                                  </button>
                                )}
                              </div>

                              <Button
                                onClick={() => setIsCheckoutModalOpen(true)}
                                icon={Zap}
                                className="w-full max-w-sm mx-auto py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all"
                              >
                                Unlock Memory (Direct UPI / QR Scanner)
                              </Button>
                            </div>
                          ) : (
                            /* Unlocked Written Story */
                            <div
                              className="prose max-w-none text-stone-900 font-serif leading-loose p-2 overflow-y-auto max-h-[500px]"
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{
                                __html: selectedChapter.content
                                  ? formatContent(selectedChapter.content)
                                  : '<p class="text-stone-400 italic font-serif">No text logged for this memory yet.</p>',
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Right Page Footer */}
                      <div className="pt-4 border-t border-[#e8e2d5] flex items-center justify-between text-[11px] font-serif text-stone-400 select-none">
                        <span>
                          {wordCount} Words • {charCount} Characters
                        </span>
                        <span className="flex items-center gap-1 font-bold text-stone-600">
                          <span>Page {selectedChapterIndex * 2 + 2}</span>
                          <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                MOBILE: SMALL POCKET DIARY SPREAD (md:hidden)
               ========================================================================= */}
            <div className="md:hidden space-y-4">
              <div className="book-leather-binding rounded-3xl p-3 shadow-xl">
                <div className="border border-[#5a4336] rounded-2xl p-1.5 bg-[#201813]">
                  <div className="bg-[#fcfbf6] rounded-xl overflow-hidden p-4 sm:p-5 space-y-4 book-page-paper">
                    {/* Ribbon Tag */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#e8e2d5]">
                      <div className="w-3 h-8 bg-red-700 satin-ribbon rounded-b-md" />
                      <span className="text-xs font-serif font-bold text-stone-700">
                        Memory {selectedChapterIndex + 1} of {chapters.length}
                      </span>
                      <span className="text-[10px] text-stone-400 font-serif">
                        {readingTime} min read
                      </span>
                    </div>

                    {/* Stamps */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-[#f5f0e6] px-2 py-0.5 rounded-lg border border-[#e2d9ca] text-stone-800 font-serif font-bold">
                        <Calendar className="w-3 h-3 text-stone-600" />
                        <span>
                          {selectedChapter.date
                            ? new Date(selectedChapter.date).toISOString().split('T')[0]
                            : 'Undated'}
                        </span>
                      </div>

                      {selectedChapter.mood && (
                        <div className="flex items-center gap-1 bg-[#f5f0e6] px-2 py-0.5 rounded-lg border border-[#e2d9ca] text-stone-800 font-serif font-bold">
                          <Smile className="w-3 h-3 text-indigo-600" />
                          <span>{selectedChapter.mood}</span>
                        </div>
                      )}

                      {selectedChapter.weather && (
                        <div className="flex items-center gap-1 bg-[#f5f0e6] px-2 py-0.5 rounded-lg border border-[#e2d9ca] text-stone-800 font-serif font-bold">
                          <CloudSun className="w-3 h-3 text-amber-600" />
                          <span>{selectedChapter.weather}</span>
                        </div>
                      )}
                    </div>

                    {selectedChapter.location && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 font-serif">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{selectedChapter.location}</span>
                      </div>
                    )}

                    <div>
                      <h2 className="text-xl font-serif font-black text-stone-900 leading-tight">
                        {selectedChapter.title || 'Untitled Memory'}
                      </h2>
                      {selectedChapter.description && (
                        <p className="text-xs text-stone-500 font-serif italic mt-0.5">
                          "{selectedChapter.description}"
                        </p>
                      )}
                    </div>

                    {/* Mobile Keepsakes */}
                    {selectedChapter.photos?.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-xs font-serif font-bold text-stone-700 block">
                          Photos ({selectedChapter.photos.length})
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedChapter.photos.map((photoUrl, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setActivePhotoModal(photoUrl)}
                              className="polaroid-frame p-1 rounded w-24 flex-shrink-0 bg-white"
                            >
                              <div className="aspect-square overflow-hidden bg-stone-100">
                                <img
                                  src={photoUrl}
                                  alt={`Photo ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile Videos */}
                    {selectedChapter.videos?.map((vidUrl, vIdx) => (
                      <div key={vIdx} className="pt-2">
                        <VideoEmbed url={vidUrl} />
                      </div>
                    ))}

                    {/* Story or Paywall */}
                    <div className="pt-3 border-t border-[#e8e2d5]">
                      {isCurrentChapterLocked ? (
                        <div className="p-4 bg-stone-100/90 rounded-2xl text-center space-y-3 border border-stone-200">
                          <Lock className="w-7 h-7 text-amber-600 mx-auto" />
                          <h4 className="text-sm font-serif font-black text-stone-900">
                            Subscriber Locked Memory
                          </h4>
                          <p className="text-xs text-stone-600 font-serif">
                            Subscribe to read all memories by {book.author}.
                          </p>
                          <Button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            icon={Zap}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs rounded-xl"
                          >
                            Subscribe (₹{currentPlan.price})
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="prose max-w-none text-stone-900 font-serif leading-relaxed text-sm book-ruled-lines p-2 rounded-lg"
                          dangerouslySetInnerHTML={{
                            __html: selectedChapter.content
                              ? formatContent(selectedChapter.content)
                              : '<p class="text-stone-400 italic font-serif">No text logged yet.</p>',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Page-Turn Navigation */}
            <div className="pt-2 flex items-center justify-between text-xs font-serif font-bold text-stone-700">
              <button
                disabled={selectedChapterIndex === 0}
                onClick={() => setSelectedChapterIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2.5 bg-white border border-[#ded7c8] hover:bg-[#eae3d5] rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Turn to Earlier Memory</span>
              </button>

              <span className="text-stone-500 hidden sm:inline">
                Day {selectedChapterIndex + 1} of {chapters.length}
              </span>

              <button
                disabled={selectedChapterIndex >= chapters.length - 1}
                onClick={() =>
                  setSelectedChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1))
                }
                className="px-4 py-2.5 bg-stone-900 hover:bg-black text-amber-50 rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Turn to Next Memory</span>
                <ChevronRight className="w-4 h-4 text-amber-300" />
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

      {/* Direct UPI Scanner & Razorpay Subscription Checkout Modal */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        book={book}
        initialPlanType={selectedPlanType}
        onPaymentSuccess={() => {
          if (onReload) onReload();
        }}
        onPayWithRazorpay={(planType) => {
          handleUnlockDiary(planType);
        }}
        isRazorpayLoading={isPaying}
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
