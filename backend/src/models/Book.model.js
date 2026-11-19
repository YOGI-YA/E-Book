import mongoose from 'mongoose';

// Chapter / Daily Life Entry Schema
const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Entry title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    mood: {
      type: String,
      default: 'Reflective',
    },
    weather: {
      type: String,
      default: 'Sunny',
    },
    timeOfDay: {
      type: String,
      default: 'Day',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    // Array of photo URLs (Cloudinary images or external URLs)
    photos: {
      type: [String],
      default: [],
    },
    // Array of video URLs (Cloudinary video clips, YouTube embeds, MP4 links)
    videos: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Chapter = mongoose.model('Chapter', chapterSchema);
export const DiaryEntry = Chapter;

// Diary / Living Life Vlog Schema
const bookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Diary title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
        default: [],
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
    },
    mood: {
      type: String,
      default: 'Daily Life',
      trim: true,
    },
    category: {
      type: String,
      default: 'Daily Vlog',
      trim: true,
    },
    accessType: {
      type: String,
      enum: ['free', 'paid'],
      default: 'free',
    },
    plans: {
      weekly: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 49, min: 0 },
      },
      monthly: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 149, min: 0 },
      },
      annual: {
        enabled: { type: Boolean, default: true },
        price: { type: Number, default: 899, min: 0 },
      },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    freePreviewEntries: {
      type: Number,
      default: 2, // First 2 entries free preview
      min: [0, 'Preview count cannot be negative'],
    },
    purchasedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isOngoing: {
      type: Boolean,
      default: true, // It's an ongoing living diary!
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Book = mongoose.model('Book', bookSchema);
export const Diary = Book;
