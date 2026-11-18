import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles, Lock, BookOpen, User, Flame, Compass, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

import DashBoardLayout from '../components/layout/DashBoardLayout';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Daily Vlog',
  'Travel Vlog',
  'Career & Hustle',
  'Personal Growth',
  'Mindfulness',
  'Student Life',
];

const ExplorePage = () => {
  const [diaries, setDiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, [selectedCategory]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await axiosInstance.get(API_PATHS.DIARIES.GET_PUBLIC_FEED, { params });
      setDiaries(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load explore feed:', err);
      toast.error('Failed to load diaries feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFeed();
  };

  return (
    <DashBoardLayout>
      <div className="space-y-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Explore Written Vlogs</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Peek into real lives.{' '}
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                Read authentic diaries.
              </span>
            </h1>
            <p className="text-purple-100/80 text-sm sm:text-base leading-relaxed">
              Support independent creators by reading their raw daily life stories. Like YouTube
              vlogs, but in intimate, deeply written format.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by topic, creator, travel spot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/20 focus:border-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-white text-gray-900 font-bold rounded-xl text-sm hover:bg-gray-100 transition-all shadow-md"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse space-y-4"
              >
                <div className="h-44 bg-gray-200 rounded-xl"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : diaries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No diaries found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Be the first creator to publish a written daily vlog in this category!
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md"
            >
              Start Writing My Diary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {diaries.map((diary) => (
              <div
                key={diary._id}
                onClick={() => navigate(`/view-book/${diary._id}`)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Cover Image or Gradient */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 overflow-hidden">
                  {diary.coverImage ? (
                    <img
                      src={diary.coverImage}
                      alt={diary.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-end p-6 text-white bg-black/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">
                        {diary.category}
                      </span>
                      <h4 className="text-lg font-black leading-snug line-clamp-2">
                        {diary.title}
                      </h4>
                    </div>
                  )}

                  {/* Price Tag Badge */}
                  <div className="absolute top-3 right-3">
                    {diary.isPremium && diary.price > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-lg">
                        ₹{diary.price}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white font-bold text-xs rounded-full shadow-lg">
                        Free
                      </span>
                    )}
                  </div>

                  {/* Mood Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-xs font-medium rounded-lg">
                      ✨ {diary.mood || 'Daily Life'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {diary.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {diary.subtitle ||
                        'Follow along daily reflections, raw moments, and personal thoughts.'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {diary.author?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
                        {diary.author}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      <span>{diary.isUnlocked ? 'Read Now' : 'Preview & Unlock'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashBoardLayout>
  );
};

export default ExplorePage;
