import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, BookOpen, Compass, CheckCircle2, Edit3 } from 'lucide-react';

import DashBoardLayout from '../components/layout/DashBoardLayout';
import BookCard from '../components/card/BookCard';
import CreateBookModal from '../components/models/CreateBookModal';
import LogEntryModal from '../components/models/LogEntryModal';
import Button from '../components/ui/Button';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import { useAuth } from '../context/AuthContext';

const DiaryCardSkeleton = () => (
  <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse space-y-4">
    <div className="h-44 bg-gray-200 rounded-2xl"></div>
    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} className="rounded-xl text-xs py-2">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs py-2"
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('my-diaries'); // 'my-diaries' | 'unlocked'
  const [myDiaries, setMyDiaries] = useState([]);
  const [unlockedDiaries, setUnlockedDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [diaryToDelete, setDiaryToDelete] = useState(null);
  const [quickEntryDiaryId, setQuickEntryDiaryId] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDiaries = async () => {
    setIsLoading(true);
    try {
      const [myRes, purchasedRes] = await Promise.allSettled([
        axiosInstance.get(API_PATHS.DIARIES.GET_MY_DIARIES),
        axiosInstance.get(API_PATHS.DIARIES.GET_PURCHASED),
      ]);

      if (myRes.status === 'fulfilled') {
        setMyDiaries(Array.isArray(myRes.value.data?.data) ? myRes.value.data.data : []);
      }
      if (purchasedRes.status === 'fulfilled') {
        setUnlockedDiaries(
          Array.isArray(purchasedRes.value.data?.data) ? purchasedRes.value.data.data : []
        );
      }
    } catch (error) {
      console.error('Failed to fetch diaries', error);
      toast.error('Failed to load your diaries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  const handleDeleteDiary = async () => {
    if (!diaryToDelete) return;
    try {
      await axiosInstance.delete(`${API_PATHS.DIARIES.DELETE}/${diaryToDelete}`);
      setMyDiaries((prev) => prev.filter((d) => d._id !== diaryToDelete));
      toast.success('Diary deleted successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete diary');
    } finally {
      setDiaryToDelete(null);
    }
  };

  const handleDiaryCreated = (diaryId) => {
    setIsCreateModalOpen(false);
    navigate(`/view-book/${diaryId}`);
  };

  const currentList = activeTab === 'my-diaries' ? myDiaries : unlockedDiaries;
  const primaryDiaryId = myDiaries.length > 0 ? myDiaries[0]._id : null;

  return (
    <DashBoardLayout>
      <div className="space-y-8">
        {/* Welcome & Action Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Welcome back, {user?.name || 'Creator'} 👋
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Your ongoing life diary. Write today's memory, attach photos & video clips anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>Explore Others</span>
            </Link>

            {primaryDiaryId && (
              <Button
                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-200 transition-all"
                onClick={() => setQuickEntryDiaryId(primaryDiaryId)}
                icon={Edit3}
              >
                Log Today's Entry
              </Button>
            )}

            <Button
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/25"
              onClick={() => setIsCreateModalOpen(true)}
              icon={Plus}
            >
              New Life Diary
            </Button>
          </div>
        </div>

        {/* Tabs: My Diaries vs Unlocked Diaries */}
        <div className="flex items-center gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my-diaries')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'my-diaries'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Life Diaries ({myDiaries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('unlocked')}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'unlocked'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Unlocked Diaries ({unlockedDiaries.length})</span>
          </button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <DiaryCardSkeleton key={i} />
            ))}
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {activeTab === 'my-diaries' ? 'No life diary started yet' : 'No unlocked diaries yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {activeTab === 'my-diaries'
                ? 'Start your living life diary. Log your memories, photos, and video clips anytime you want.'
                : 'Browse our explore feed to discover authentic daily vlogs written by creators and unlock them with Razorpay.'}
            </p>
            {activeTab === 'my-diaries' ? (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                icon={Plus}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md"
              >
                Start your Life Diary
              </Button>
            ) : (
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md"
              >
                <Compass className="w-4 h-4" />
                Explore Creators
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentList.map((diary) => (
              <BookCard
                key={diary._id}
                book={diary}
                onDelete={() => setDiaryToDelete(diary._id)}
                onQuickAddEntry={(id) => setQuickEntryDiaryId(id)}
                isPurchasedView={activeTab === 'unlocked'}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <ConfirmationModal
          isOpen={!!diaryToDelete}
          onClose={() => setDiaryToDelete(null)}
          onConfirm={handleDeleteDiary}
          title="Delete Diary"
          message="Are you sure you want to delete this diary? All written memories, photos, and video links will be permanently removed."
        />

        <CreateBookModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onBookCreated={handleDiaryCreated}
        />

        {quickEntryDiaryId && (
          <LogEntryModal
            isOpen={!!quickEntryDiaryId}
            onClose={() => setQuickEntryDiaryId(null)}
            diaryId={quickEntryDiaryId}
            onEntrySaved={fetchDiaries}
          />
        )}
      </div>
    </DashBoardLayout>
  );
};

export default DashboardPage;
