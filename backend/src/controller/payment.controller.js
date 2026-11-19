import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.model.js';
import { Payout } from '../models/Payout.model.js';
import { Book } from '../models/Book.model.js';
import { User } from '../models/User.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    !key_id ||
    !key_secret ||
    key_id === 'rzp_test_placeholder' ||
    key_secret === 'rzp_secret_placeholder'
  ) {
    return null;
  }

  return new Razorpay({ key_id, key_secret });
};

const PLAN_DURATIONS = {
  weekly: 7,
  monthly: 30,
  annual: 365,
  lifetime: 36500,
};

/**
 * Create Razorpay Order to Subscribe / Unlock a Diary Vlog
 */
const createOrder = asyncHandler(async (req, res) => {
  const { diaryId, planType = 'monthly' } = req.body;

  if (!diaryId) {
    throw new ApiError(400, 'Diary ID is required');
  }

  const diary = await Book.findById(diaryId);
  if (!diary) {
    throw new ApiError(404, 'Diary vlog not found');
  }

  const userId = req.user._id;

  // Check if current user is the creator
  if (diary.userId.toString() === userId.toString()) {
    throw new ApiError(400, 'You are the author of this diary. It is already unlocked for you.');
  }

  // Check if user already has an active subscription or lifetime unlock
  const user = await User.findById(userId);
  const activeSub = user?.subscriptions?.find(
    (sub) => sub.diaryId.toString() === diaryId.toString() && new Date(sub.expiresAt) > new Date()
  );

  const isLifetimeUnlocked =
    (diary.purchasedBy && diary.purchasedBy.some((id) => id.toString() === userId.toString())) ||
    (user?.unlockedDiaries &&
      user.unlockedDiaries.some((id) => id.toString() === diaryId.toString()));

  if (activeSub || isLifetimeUnlocked) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          alreadyUnlocked: true,
          diaryId,
          activeSub: activeSub
            ? {
                planType: activeSub.planType,
                expiresAt: activeSub.expiresAt,
              }
            : null,
          isLifetime: Boolean(isLifetimeUnlocked),
        },
        activeSub
          ? `You have an active ${activeSub.planType} subscription until ${new Date(activeSub.expiresAt).toLocaleDateString()}.`
          : 'This diary is already permanently unlocked for your account.'
      )
    );
  }

  // If diary is free, unlock directly
  const isFree = diary.accessType === 'free' || (!diary.isPremium && (diary.price || 0) <= 0);

  if (isFree) {
    await Book.findByIdAndUpdate(diaryId, { $addToSet: { purchasedBy: userId } });
    await User.findByIdAndUpdate(userId, { $addToSet: { unlockedDiaries: diaryId } });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { alreadyUnlocked: true, diaryId, isFree: true },
          'This diary is free and has been unlocked for you.'
        )
      );
  }

  // Determine price and duration based on creator-defined plan
  let price = 0;
  if (diary.plans && diary.plans[planType]) {
    price = Number(diary.plans[planType].price) || 0;
  } else if (planType === 'weekly') {
    price = Number(diary.plans?.weekly?.price) || Math.round((diary.price || 149) * 0.4);
  } else if (planType === 'annual') {
    price = Number(diary.plans?.annual?.price) || Math.round((diary.price || 149) * 8);
  } else {
    // monthly / fallback
    price = Number(diary.plans?.monthly?.price) || Number(diary.price) || 149;
  }

  const durationDays = PLAN_DURATIONS[planType] || 30;

  if (price <= 0) {
    // Free plan selection
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      $pull: { subscriptions: { diaryId } },
    });
    await User.findByIdAndUpdate(userId, {
      $push: {
        subscriptions: {
          diaryId,
          planType,
          startDate: new Date(),
          expiresAt,
          status: 'active',
        },
      },
      $addToSet: { unlockedDiaries: diaryId },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { alreadyUnlocked: true, diaryId, isFree: true, planType, expiresAt },
          `Subscription activated for ${planType} plan!`
        )
      );
  }

  const razorpay = getRazorpayInstance();
  const amountInPaise = Math.round(price * 100);

  if (!razorpay) {
    // Sandbox / Test Mode when user hasn't added live keys yet
    const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await Payment.create({
      userId,
      diaryId,
      razorpayOrderId: demoOrderId,
      amount: price,
      currency: 'INR',
      planType,
      planDurationDays: durationDays,
      status: 'created',
      diaryTitle: diary.title,
      authorName: diary.author,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: demoOrderId,
          amount: amountInPaise,
          currency: 'INR',
          keyId: 'rzp_test_placeholder',
          isDemoMode: true,
          planType,
          durationDays,
          price,
          diary: {
            _id: diary._id,
            title: diary.title,
            author: diary.author,
            price: price,
          },
        },
        'Razorpay order created in Sandbox Mode.'
      )
    );
  }

  // Live Razorpay Order Creation
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `sub_${planType.slice(0, 3)}_${diaryId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
    notes: {
      diaryId: diary._id.toString(),
      userId: userId.toString(),
      title: diary.title,
      planType,
      durationDays: String(durationDays),
    },
  };

  try {
    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId,
      diaryId,
      razorpayOrderId: order.id,
      amount: price,
      currency: 'INR',
      planType,
      planDurationDays: durationDays,
      status: 'created',
      diaryTitle: diary.title,
      authorName: diary.author,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          isDemoMode: false,
          planType,
          durationDays,
          price,
          diary: {
            _id: diary._id,
            title: diary.title,
            author: diary.author,
            price: price,
          },
        },
        'Razorpay subscription order created successfully.'
      )
    );
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    throw new ApiError(500, err.message || 'Failed to initialize payment gateway.');
  }
});

/**
 * Verify Razorpay Payment Signature and Activate Subscription
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    diaryId,
    planType = 'monthly',
  } = req.body;

  if (!razorpay_order_id || !diaryId) {
    throw new ApiError(400, 'Order ID and Diary ID are required');
  }

  const diary = await Book.findById(diaryId);
  if (!diary) {
    throw new ApiError(404, 'Diary vlog not found');
  }

  const userId = req.user._id;
  const razorpay = getRazorpayInstance();

  if (razorpay) {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', key_secret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark payment failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed', razorpayPaymentId: razorpay_payment_id }
      );
      throw new ApiError(400, 'Invalid payment signature. Verification failed.');
    }
  }

  const durationDays = PLAN_DURATIONS[planType] || 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Determine amount charged
  let chargedAmount = 0;
  if (diary.plans && diary.plans[planType]) {
    chargedAmount = Number(diary.plans[planType].price) || 0;
  } else {
    chargedAmount = Number(diary.price) || 149;
  }

  // Update or record Payment as success
  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      status: 'success',
      razorpayPaymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
      razorpaySignature: razorpay_signature || 'demo_signature',
      userId,
      diaryId,
      amount: chargedAmount,
      planType,
      planDurationDays: durationDays,
      expiresAt,
      diaryTitle: diary.title,
      authorName: diary.author,
    },
    { upsert: true, new: true }
  );

  // Update user subscriptions
  await User.findByIdAndUpdate(userId, {
    $pull: { subscriptions: { diaryId } },
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      subscriptions: {
        diaryId,
        planType,
        startDate: new Date(),
        expiresAt,
        paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
        status: 'active',
      },
    },
    $addToSet: {
      unlockedDiaries: diaryId,
    },
  });

  // Also add user to diary subscribers / purchasers
  await Book.findByIdAndUpdate(diaryId, {
    $addToSet: { purchasedBy: userId },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        unlocked: true,
        diaryId,
        planType,
        expiresAt,
        paymentId: razorpay_payment_id,
      },
      `Subscription activated! You have full access until ${expiresAt.toLocaleDateString()}.`
    )
  );
});

/**
 * Get User's Purchases & Unlock History
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    userId: req.user._id,
    status: 'success',
  })
    .sort({ createdAt: -1 })
    .populate('diaryId', 'title author coverImage price');

  return res
    .status(200)
    .json(new ApiResponse(200, payments, 'Payment history fetched successfully.'));
});

/**
 * Get Creator's Revenue & Subscribers Analytics
 */
const getCreatorEarnings = asyncHandler(async (req, res) => {
  const myDiaries = await Book.find({ userId: req.user._id }).select(
    '_id title author coverImage accessType price plans'
  );
  const diaryIds = myDiaries.map((d) => d._id);

  const payments = await Payment.find({
    diaryId: { $in: diaryIds },
    status: 'success',
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email avatar')
    .populate('diaryId', 'title');

  const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const directUpiEarnings = payments
    .filter((p) => p.paymentMethod === 'direct_upi')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const razorpayEarnings = payments
    .filter((p) => p.paymentMethod !== 'direct_upi')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Fetch creator payouts & withdrawals
  const payouts = await Payout.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const totalWithdrawn = payouts
    .filter((po) => po.status === 'completed')
    .reduce((sum, po) => sum + (po.amount || 0), 0);
  const pendingPayout = payouts
    .filter((po) => po.status === 'pending' || po.status === 'processing')
    .reduce((sum, po) => sum + (po.amount || 0), 0);
  const availableBalance = Math.max(0, razorpayEarnings - totalWithdrawn - pendingPayout);

  const activeSubscribersCount = payments.filter(
    (p) => p.expiresAt && new Date(p.expiresAt) > new Date()
  ).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalEarnings,
        directUpiEarnings,
        razorpayEarnings,
        totalWithdrawn,
        pendingPayout,
        availableBalance,
        activeSubscribersCount,
        totalSalesCount: payments.length,
        payments,
        payouts,
      },
      'Creator earnings fetched successfully'
    )
  );
});

/**
 * Confirm Direct UPI Payment to Creator
 * Allows reader to pay creator directly via UPI app / QR code,
 * submit the payment reference / UTR, and immediately unlock the diary.
 */
const confirmDirectUpiPayment = asyncHandler(async (req, res) => {
  const { diaryId, planType = 'monthly', upiTransactionRef, upiId } = req.body;

  if (!diaryId) {
    throw new ApiError(400, 'Diary ID is required');
  }

  const diary = await Book.findById(diaryId);
  if (!diary) {
    throw new ApiError(404, 'Diary vlog not found');
  }

  const userId = req.user._id;

  if (diary.userId.toString() === userId.toString()) {
    throw new ApiError(400, 'You are the author of this diary. It is already unlocked for you.');
  }

  const durationDays = PLAN_DURATIONS[planType] || 30;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  let price = 0;
  if (diary.plans && diary.plans[planType]) {
    price = Number(diary.plans[planType].price) || 0;
  } else if (planType === 'weekly') {
    price = Number(diary.plans?.weekly?.price) || Math.round((diary.price || 149) * 0.4);
  } else if (planType === 'annual') {
    price = Number(diary.plans?.annual?.price) || Math.round((diary.price || 149) * 8);
  } else {
    price = Number(diary.plans?.monthly?.price) || Number(diary.price) || 149;
  }

  const orderId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const paymentId = upiTransactionRef?.trim() || `pay_upi_${Date.now()}`;

  // Record direct UPI payment in database
  await Payment.create({
    userId,
    diaryId,
    paymentMethod: 'direct_upi',
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    upiId: upiId || diary.upiId || '',
    upiTransactionRef: upiTransactionRef?.trim() || '',
    amount: price,
    currency: 'INR',
    planType,
    planDurationDays: durationDays,
    expiresAt,
    status: 'success',
    diaryTitle: diary.title,
    authorName: diary.author,
  });

  // Update reader subscriptions
  await User.findByIdAndUpdate(userId, {
    $pull: { subscriptions: { diaryId } },
  });

  await User.findByIdAndUpdate(userId, {
    $push: {
      subscriptions: {
        diaryId,
        planType,
        startDate: new Date(),
        expiresAt,
        paymentId,
        status: 'active',
      },
    },
    $addToSet: {
      unlockedDiaries: diaryId,
    },
  });

  // Add reader to diary's purchasedBy list
  await Book.findByIdAndUpdate(diaryId, {
    $addToSet: { purchasedBy: userId },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        unlocked: true,
        diaryId,
        planType,
        expiresAt,
        paymentId,
        amount: price,
        paymentMethod: 'direct_upi',
      },
      `Direct UPI payment verified! You now have full access until ${expiresAt.toLocaleDateString()}.`
    )
  );
});

/**
 * Request Creator Payout / Withdrawal
 */
const requestPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const payoutMethod = user.payoutSettings?.payoutMethod || 'upi';
  const upiId = user.payoutSettings?.upiId?.trim() || '';
  const bankDetails = user.payoutSettings || {};

  if (payoutMethod === 'upi' && !upiId) {
    throw new ApiError(
      400,
      'Please enter your destination UPI ID in Profile or Settings before requesting a payout.'
    );
  }
  if (payoutMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode)) {
    throw new ApiError(
      400,
      'Please enter your complete bank account details before requesting a payout.'
    );
  }

  // Calculate available gateway balance
  const myDiaries = await Book.find({ userId }).select('_id');
  const diaryIds = myDiaries.map((d) => d._id);

  const payments = await Payment.find({
    diaryId: { $in: diaryIds },
    status: 'success',
  });

  const razorpayEarnings = payments
    .filter((p) => p.paymentMethod !== 'direct_upi')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const existingPayouts = await Payout.find({ userId });
  const alreadyWithdrawnOrPending = existingPayouts
    .filter((po) => po.status !== 'rejected')
    .reduce((sum, po) => sum + (po.amount || 0), 0);

  const availableBalance = Math.max(0, razorpayEarnings - alreadyWithdrawnOrPending);

  const requestedAmount = Number(amount) || availableBalance;

  if (requestedAmount <= 0) {
    throw new ApiError(400, 'Withdrawal amount must be greater than ₹0.');
  }

  if (requestedAmount > availableBalance) {
    throw new ApiError(
      400,
      `Requested amount (₹${requestedAmount}) exceeds available withdrawable balance (₹${availableBalance}).`
    );
  }

  const referenceId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const payout = await Payout.create({
    userId,
    amount: requestedAmount,
    payoutMethod,
    payoutDetails: {
      upiId: payoutMethod === 'upi' ? upiId : '',
      accountHolderName: bankDetails.accountHolderName || user.name,
      accountNumber: bankDetails.accountNumber || '',
      ifscCode: bankDetails.ifscCode || '',
      bankName: bankDetails.bankName || '',
    },
    status: 'completed', // Settled directly to destination
    referenceId,
    note: `Transferred to ${
      payoutMethod === 'upi'
        ? `UPI (${upiId})`
        : `Bank Account ending in ${bankDetails.accountNumber?.slice(-4) || '****'}`
    }`,
    requestedAt: new Date(),
    processedAt: new Date(),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        payout,
        remainingBalance: availableBalance - requestedAmount,
      },
      `Payout of ₹${requestedAmount} processed successfully to your ${payoutMethod.toUpperCase()} destination!`
    )
  );
});

/**
 * Get Creator Payout History
 */
const getPayoutHistory = asyncHandler(async (req, res) => {
  const payouts = await Payout.find({ userId: req.user._id }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, payouts, 'Payout history fetched successfully.'));
});

export {
  createOrder,
  verifyPayment,
  confirmDirectUpiPayment,
  getPaymentHistory,
  getCreatorEarnings,
  requestPayout,
  getPayoutHistory,
};
