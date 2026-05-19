import { Router } from 'express';
import {
  cancelBooking,
  deleteReview,
  getStats,
  listBookings,
  listListings,
  listReviews,
  listUsers,
  updateListingStatus,
  updateUserRole,
} from '../controllers/adminController.js';
import requireAuth from '../middlewares/requireAuth.js';
import requireRole from '../middlewares/requireRole.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/listings', listListings);
router.patch('/listings/:id/status', updateListingStatus);
router.get('/bookings', listBookings);
router.patch('/bookings/:id/cancel', cancelBooking);
router.get('/reviews', listReviews);
router.delete('/reviews/:id', deleteReview);

export default router;
