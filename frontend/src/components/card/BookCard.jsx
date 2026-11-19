import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Calendar, Eye, Plus } from 'lucide-react';

const BookCard = ({ book, onDelete, onQuickAddEntry, isPurchasedView = false }) => {
  const navigate = useNavigate();
  const coverImageUrl = book.coverImage || '';
  const entriesCount = book.chapters?.length || 0;

  return (
    <div
      className="group relative bg-white rounded-3xl shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200/80 hover:-translate-y-1.5 flex flex-col justify-between"
      onClick={() => navigate(`/view-book/${book._id}`)}
    >
      <div>
        {/* Cover / Header */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col justify-end p-5 text-white bg-black/15">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 mb-1">
                {book.category || 'Daily Vlog'}
              </span>
              <h4 className="text-lg font-black leading-snug line-clamp-2">{book.title}</h4>
            </div>
          )}

          {/* Price or Access Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {book.accessType === 'paid' || (book.isPremium && book.price > 0) ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-md">
                Sub ₹{book.plans?.monthly?.price || book.price}/mo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white font-bold text-xs rounded-full shadow-md">
                Free
              </span>
            )}
          </div>

          {/* Mood Badge */}
          {book.mood && (
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold rounded-xl">
                ✨ {book.mood}
              </span>
            </div>
          )}

          {/* Hover Actions (Log Entry / Edit / Delete) */}
          {!isPurchasedView && (
            <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onQuickAddEntry && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAddEntry(book._id);
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md transition-all"
                  title="Log Today's Entry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/editor/${book._id}`);
                }}
                className="p-2 bg-white/95 rounded-xl text-gray-700 hover:text-indigo-600 hover:bg-white shadow-md transition-all"
                title="Edit Diary Settings"
              >
                <Edit className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(book._id);
                  }}
                  className="p-2 bg-white/95 rounded-xl text-gray-700 hover:text-red-600 hover:bg-white shadow-md transition-all"
                  title="Delete Diary"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {book.category || 'Daily Vlog'}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              {entriesCount} {entriesCount === 1 ? 'day' : 'days'}
            </span>
          </div>

          <h3 className="text-base font-extrabold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {book.title}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {book.subtitle || 'Personal thoughts and daily life memories.'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <span className="truncate max-w-[130px] font-medium">by {book.author}</span>
        <span className="font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" /> Open Diary
        </span>
      </div>
    </div>
  );
};

export default BookCard;
