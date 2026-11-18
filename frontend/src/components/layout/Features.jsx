import { FEATURES } from '../../utils/data.js';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Features = () => {
  return (
    <div id="features" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-semibold text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Built for Daily Life Creators & Avid Readers</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Vlog in Written Text
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-500">
            A frictionless platform to document your days, verify with instant email OTP, and
            monetize via Razorpay.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white border border-gray-200/80 rounded-3xl p-8 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-105 transition-all`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="text-lg font-black text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>

                <div className="pt-6 mt-4 border-t border-gray-100 flex items-center text-indigo-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Explore capability</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 rounded-3xl p-8 sm:p-14 text-center shadow-2xl text-white space-y-4">
          <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to turn your life into a written vlog series?
          </h3>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto">
            Join thousands of creators writing daily diaries and earning from their true stories.
          </p>
          <div className="pt-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 rounded-2xl font-black hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              <span>Get Started in 30 Seconds</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
