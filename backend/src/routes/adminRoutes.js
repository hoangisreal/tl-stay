import { Router } from 'express';
import {
  cancelBooking,
  deleteReview,
  getStats,
  listBookings,
  listListings,
  listMessages,
  listReviews,
  listUsers,
  updateListingStatus,
  updateUserRole,
  getActivityLogs,
  verifyHost,
} from '../controllers/adminController.js';
import requireAuth from '../middlewares/requireAuth.js';
import requirePermission from '../middlewares/requirePermission.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', requirePermission('analytics:read'), getStats);
router.get('/users', requirePermission('users:read'), listUsers);
router.patch('/users/:id/role', requirePermission('users:role'), updateUserRole);
router.patch('/users/:id/verify', requirePermission('users:verify'), verifyHost);
router.get('/listings', requirePermission('listings:read'), listListings);
router.patch('/listings/:id/status', requirePermission('listings:update'), updateListingStatus);
router.get('/bookings', requirePermission('bookings:read'), listBookings);
router.patch('/bookings/:id/cancel', requirePermission('bookings:update'), cancelBooking);
router.get('/reviews', requirePermission('reviews:read'), listReviews);
router.delete('/reviews/:id', requirePermission('reviews:delete'), deleteReview);
router.get('/messages', requirePermission('messages:read'), listMessages);
router.get('/activity-logs', requirePermission('activity:read'), getActivityLogs);

export default router;
