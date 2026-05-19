import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
} from '../controllers/authController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.patch('/change-password', requireAuth, changePassword);

export default router;
