import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPath';
import toast from 'react-hot-toast';
import { BookOpen, ArrowLeft } from 'lucide-react';

import DashBoardLayout from '../components/layout/DashBoardLayout';
import ViewBook from '../components/view/ViewBook';

const ViewBookSkeleton = () => (
  <div className="animate-pulse max-w-4xl mx-auto p-8 space-y-6">
    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
    <div className="h-64 bg-slate-200 rounded-2xl"></div>
  </div>
);

const ViewBookPage = () => {
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { bookId } = useParams();

  const fetchBook = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${API_PATHS.DIARIES.GET_BY_ID}/${bookId}`);
      setBook(response.data?.data);
    } catch (error) {
      console.error('Failed to fetch diary', error);
      toast.error('Failed to load this diary vlog.');
    } finally {
      setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  if (isLoading) {
    return (
      <DashBoardLayout>
        <ViewBookSkeleton />
      </DashBoardLayout>
    );
  }

  if (!book) {
    return (
      <DashBoardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Diary Vlog Not Found</h3>
          <p className="text-gray-500 max-w-md mb-6 text-sm">
            The diary you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </DashBoardLayout>
    );
  }

  return <ViewBook book={book} onReload={fetchBook} />;
};

export default ViewBookPage;
