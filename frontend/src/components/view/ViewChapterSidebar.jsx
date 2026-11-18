import { Lock, Unlock, Plus, Calendar, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const ViewChapterSidebar = ({
  book,
  selectedChapterIndex,
  onSelectChapter,
  isOpen,
  onClose,
  onUnlockClick,
  onAddEntryClick,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed lg:relative left-0 top-0 h-full w-80 bg-white
          border-r border-gray-200 z-50 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
          <div>
            <h3 className="font-black text-gray-900 text-sm tracking-tight">Timeline & Memories</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {book.chapters?.length || 0} days recorded
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onAddEntryClick && (
              <button
                onClick={onAddEntryClick}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                title="Write new entry"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Entry</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="lg:hidden text-xs font-semibold px-2 py-1 bg-gray-200 rounded-lg text-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Chapters / Timeline List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {book.chapters?.map((chapter, index) => {
            const isActive = selectedChapterIndex === index;
            const isLocked = chapter.isLocked;
            const photosCount = chapter.photos?.length || chapter.photosCount || 0;
            const videosCount = chapter.videos?.length || chapter.videosCount || 0;

            return (
              <button
                key={chapter._id || index}
                onClick={() => {
                  onSelectChapter(index);
                  onClose();
                }}
                className={`
                  w-full text-left p-4 transition-all flex items-start gap-3
                  ${isActive ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-gray-50'}
                `}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : isLocked
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-indigo-950 font-black' : 'text-gray-800'
                      }`}
                    >
                      {chapter.title}
                    </span>

                    {isLocked ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded flex-shrink-0">
                        Locked
                      </span>
                    ) : chapter.isPreview ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded flex-shrink-0">
                        Free Preview
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    {chapter.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(chapter.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}

                    {photosCount > 0 && (
                      <span className="flex items-center gap-0.5 text-indigo-500 font-medium">
                        <ImageIcon className="w-3 h-3" />
                        {photosCount}
                      </span>
                    )}

                    {videosCount > 0 && (
                      <span className="flex items-center gap-0.5 text-purple-500 font-medium">
                        <VideoIcon className="w-3 h-3" />
                        {videosCount}
                      </span>
                    )}

                    {chapter.mood && <span>• {chapter.mood}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Unlock Prompt (if not unlocked) */}
        {!book.isUnlocked && book.isPremium && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">Unlock Full Diary Stream</span>
              <span className="text-xs font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                ₹{book.price}
              </span>
            </div>
            <button
              onClick={onUnlockClick}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock with Razorpay</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default ViewChapterSidebar;
