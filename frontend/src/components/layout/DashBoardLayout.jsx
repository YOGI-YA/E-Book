import { useState, useEffect, useRef } from 'react';
import { BookOpen, Compass, LayoutDashboard, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashBoardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isExplore = location.pathname.startsWith('/explore');
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-none">
                    LifeLog
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
                    Written Daily Vlogs
                  </span>
                </div>
              </Link>

              {/* Navigation links */}
              <nav className="hidden sm:flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isDashboard
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>My Diaries</span>
                </Link>

                <Link
                  to="/explore"
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isExplore
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore Feed</span>
                </Link>
              </nav>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-all border border-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold text-gray-800 max-w-[120px] truncate hidden sm:inline-block">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <div className="font-bold text-gray-900 text-sm truncate">{user?.name}</div>
                    <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    My Diaries
                  </Link>

                  <Link
                    to="/explore"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Explore Feed
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default DashBoardLayout;
