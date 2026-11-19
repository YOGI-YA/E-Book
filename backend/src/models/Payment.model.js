import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    diaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'direct_upi'],
      default: 'razorpay',
    },
    upiId: {
      type: String,
      default: '',
    },
    upiTransactionRef: {
      type: String,
      default: '',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: '',
    },
    razorpaySignature: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true, // in INR
    },
    currency: {
      type: String,
      default: 'INR',
    },
    planType: {
      type: String,
      enum: ['weekly', 'monthly', 'annual', 'lifetime'],
      default: 'monthly',
    },
    planDurationDays: {
      type: Number,
      default: 30,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['created', 'success', 'failed'],
      default: 'created',
      index: true,
    },
    diaryTitle: {
      type: String,
      default: '',
    },
    authorName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
