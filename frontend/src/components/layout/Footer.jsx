import { BookOpen, Twitter, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 justify-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                LifeLog
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              Written daily life diaries and text vlogs. Document your journey, connect with
              readers, and monetize with Razorpay.
            </p>

            <div className="flex gap-3 justify-center pt-2">
              <a
                href="https://x.com/yogendervermaa"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-900 rounded-xl hover:bg-indigo-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/yogendervermaa/"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-900 rounded-xl hover:bg-indigo-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/YogenderVermaa"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-900 rounded-xl hover:bg-indigo-600 transition-colors"
                aria-label="Github"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} LifeLog Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/explore" className="hover:text-white transition-colors">
              Explore Diaries
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-white transition-colors">
              Create Diary
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
