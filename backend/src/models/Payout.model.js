import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Minimum withdrawal amount is ₹1'],
    },
    payoutMethod: {
      type: String,
      enum: ['upi', 'bank'],
      default: 'upi',
    },
    payoutDetails: {
      upiId: { type: String, default: '' },
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'completed', // Auto-cleared in self-service mode or instant settlement
      index: true,
    },
    referenceId: {
      type: String,
      default: '',
    },
    note: {
      type: String,
      default: 'Creator subscription earnings payout',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Payout = mongoose.model('Payout', payoutSchema);
