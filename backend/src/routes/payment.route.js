import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { createOrder, verifyPayment, getPaymentHistory } from '../controller/payment.controller.js';

const router = Router();

router.use(verifyJWT);

router.route('/create-order').post(createOrder);
router.route('/verify-payment').post(verifyPayment);
router.route('/history').get(getPaymentHistory);

export default router;
