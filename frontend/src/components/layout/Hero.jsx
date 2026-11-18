import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Compass,
  ShieldCheck,
  Heart,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 overflow-hidden py-12 sm:py-20 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100/80 rounded-full text-indigo-700 font-semibold text-xs shadow-xs">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>The Next Generation of Daily Vlogging — In Written Text</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
              Share your daily life.{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Get paid to write your diary.
              </span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Turn your daily life into an intimate, binge-worthy written vlog. Readers discover
              your raw moments, subscribe, and pay via Razorpay to unlock your daily journey.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold hover:from-indigo-700 hover:to-violet-700 shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
              >
                <span>Start Your Diary Vlog</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-800 rounded-2xl font-bold border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-xs"
              >
                <Compass className="w-5 h-5 text-indigo-600" />
                <span>Explore Diaries</span>
              </Link>
            </div>

            {/* Micro Features */}
            <div className="flex flex-wrap items-center gap-5 pt-4 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Passwordless OTP Login</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Instant Razorpay Payouts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI Vlog Writing Assistant</span>
              </div>
            </div>

            {/* Social Stats */}
            <div className="flex items-center gap-8 pt-8 border-t border-gray-200/80">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">50K+</div>
                <div className="text-xs text-gray-500 font-medium">Daily Entries</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600">₹12L+</div>
                <div className="text-xs text-gray-500 font-medium">Earned by Creators</div>
              </div>
              <div className="w-px h-10 bg-gray-200"></div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">4.9/5</div>
                <div className="text-xs text-gray-500 font-medium">Reader Rating</div>
              </div>
            </div>
          </div>

          {/* Right Visual - Interactive Preview of a Written Vlog Entry */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl -z-10"></div>

            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Creator Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                    M
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">Maya Sen</h3>
                    <p className="text-xs text-gray-400">@maya_travels • 4.2k readers</p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black text-xs shadow-xs">
                  ₹99 Unlock
                </span>
              </div>

              {/* Diary Sample Entry */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                  <span className="px-2 py-0.5 bg-indigo-50 rounded-md">Day 4 of 10</span>
                  <span>• Manali Backpacking Diary</span>
                </div>

                <h4 className="text-xl font-black text-gray-900">
                  "The morning the mountain road disappeared into mist."
                </h4>

                <p className="text-sm text-gray-600 leading-relaxed">
                  I woke up at 5:30 AM to the smell of woodsmoke and wet pine needles. The bus had
                  broken down right before the pass, and 12 strangers were sharing steaming chai in
                  a roadside dhaba...
                </p>

                {/* Simulated Locked Preview Strip */}
                <div className="relative p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                        Next 6 Days Locked
                      </div>
                      <div className="text-sm font-black text-white">
                        Unlock with Razorpay to continue reading
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md">
                      Unlock ₹99
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
