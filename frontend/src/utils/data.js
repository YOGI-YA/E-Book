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

export const PRESET_DIARY_COVERS = [
  {
    id: 'vintage-leather',
    name: 'Vintage Leather Journal',
    vibe: 'Classic & Timeless',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    color: '#8B4513',
  },
  {
    id: 'botanical-sage',
    name: 'Botanical Herbarium',
    vibe: 'Mindful & Calming',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    color: '#3D5A45',
  },
  {
    id: 'midnight-stargazer',
    name: 'Midnight Galaxy',
    vibe: 'Deep Thoughts & Dreams',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
    color: '#1a1b3a',
  },
  {
    id: 'golden-sunset',
    name: 'Golden Sunset Horizon',
    vibe: 'Warmth & Evening Musings',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=800&q=80',
    color: '#D97706',
  },
  {
    id: 'cozy-coffee',
    name: 'Morning Coffee & Notes',
    vibe: 'Candid & Daily Life',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80',
    color: '#6B4226',
  },
  {
    id: 'wanderlust-travel',
    name: 'Wanderlust & Maps',
    vibe: 'Expeditions & Adventures',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    color: '#0284C7',
  },
  {
    id: 'cherry-blossom',
    name: 'Sakura Petals',
    vibe: 'Gentle & Poetic',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=800&q=80',
    color: '#DB2777',
  },
  {
    id: 'dark-academia',
    name: 'Dark Academia Library',
    vibe: 'Literary & Antique',
    url: 'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?auto=format&fit=crop&w=800&q=80',
    color: '#29180C',
  },
  {
    id: 'serene-ocean',
    name: 'Pacific Blue Ocean',
    vibe: 'Peaceful & Expansive',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    color: '#0D9488',
  },
  {
    id: 'neon-city',
    name: 'Cyberpunk & Night Lights',
    vibe: 'Modern City Hustle',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    color: '#7C3AED',
  },
];
