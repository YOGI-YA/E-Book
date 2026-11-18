import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment } from '../models/Payment.model.js';
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

/**
 * Create Razorpay Order to Unlock a Diary Vlog
 */
const createOrder = asyncHandler(async (req, res) => {
  const { diaryId } = req.body;

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

  // Check if user already purchased
  const isAlreadyPurchased =
    (diary.purchasedBy && diary.purchasedBy.some((id) => id.toString() === userId.toString())) ||
    (req.user.unlockedDiaries &&
      req.user.unlockedDiaries.some((id) => id.toString() === diaryId.toString()));

  if (isAlreadyPurchased) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { alreadyUnlocked: true, diaryId },
          'This diary is already unlocked for your account.'
        )
      );
  }

  const price = diary.price || 0;
  if (price <= 0) {
    // If diary is free, unlock directly
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
          diary: {
            _id: diary._id,
            title: diary.title,
            author: diary.author,
            price: diary.price,
          },
        },
        'Razorpay order created in Sandbox Mode. (Add RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in backend/.env for live gateway).'
      )
    );
  }

  // Live Razorpay Order Creation
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `rcpt_d_${diaryId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
    notes: {
      diaryId: diary._id.toString(),
      userId: userId.toString(),
      title: diary.title,
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
          diary: {
            _id: diary._id,
            title: diary.title,
            author: diary.author,
            price: diary.price,
          },
        },
        'Razorpay order created successfully.'
      )
    );
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    throw new ApiError(500, err.message || 'Failed to initialize payment gateway.');
  }
});

/**
 * Verify Razorpay Payment Signature and Unlock Diary
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, diaryId } = req.body;

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

  // Update or record Payment as success
  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      status: 'success',
      razorpayPaymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
      razorpaySignature: razorpay_signature || 'demo_signature',
      userId,
      diaryId,
      amount: diary.price || 0,
      diaryTitle: diary.title,
      authorName: diary.author,
    },
    { upsert: true, new: true }
  );

  // Unlock Diary for the User
  await Book.findByIdAndUpdate(diaryId, {
    $addToSet: { purchasedBy: userId },
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { unlockedDiaries: diaryId },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        unlocked: true,
        diaryId,
        paymentId: razorpay_payment_id,
      },
      'Payment verified successfully! You now have full access to this diary vlog.'
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

export { createOrder, verifyPayment, getPaymentHistory };
