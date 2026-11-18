import { BookOpen, ShieldCheck, DollarSign, Sparkles, Eye, Download } from 'lucide-react';

export const FEATURES = [
  {
    title: 'Written Daily Vlogs',
    description:
      'Like a YouTube vlog, but in intimate, beautifully crafted text. Document your real daily life, adventures, and milestones.',
    icon: BookOpen,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    title: 'Passwordless Email OTP',
    description:
      'Zero passwords to forget or leak. Receive a secure 6-digit one-time passcode on your email for instant sign-in.',
    icon: ShieldCheck,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Razorpay Monetization',
    description:
      'Turn your personal journey into revenue. Readers unlock your premium diary series securely using UPI, Cards, and Wallets.',
    icon: DollarSign,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Free Preview Teasers',
    description:
      'Offer 1 or 2 daily entries free to hook readers, then lock subsequent days behind a seamless Razorpay paywall.',
    icon: Eye,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'AI Vlog Assistant',
    description:
      'Jot down messy bullet notes from your day, and let AI transform them into vivid, emotionally rich daily diary entries.',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    title: 'Instant Keepsake Export',
    description:
      'Export your entire diary series into beautifully formatted PDF and DOCX documents with a single click.',
    icon: Download,
    gradient: 'from-rose-500 to-red-600',
  },
];
