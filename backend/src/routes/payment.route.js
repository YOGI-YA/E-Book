import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  createOrder,
  verifyPayment,
  confirmDirectUpiPayment,
  getPaymentHistory,
  getCreatorEarnings,
  requestPayout,
  getPayoutHistory,
} from '../controller/payment.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/create-order').post(createOrder);
router.route('/verify-payment').post(verifyPayment);
router.route('/direct-upi-confirm').post(confirmDirectUpiPayment);
router.route('/history').get(getPaymentHistory);
router.route('/creator-earnings').get(getCreatorEarnings);
router.route('/request-payout').post(requestPayout);
router.route('/payouts').get(getPayoutHistory);

export default router;
