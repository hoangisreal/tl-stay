import express from 'express';
import { getOverview, getRevenue, getTop, getBookings, getHostAnalytics } from '../controllers/analyticsController.js';
import requireAuth from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import requirePermission from '../middlewares/requirePermission.js';

const router = express.Router();

router.get('/overview', requireAuth, requirePermission('analytics:read'), getOverview);
router.get('/revenue', requireAuth, requirePermission('analytics:read'), getRevenue);
router.get('/top-listings', requireAuth, requirePermission('analytics:read'), getTop);
router.get('/bookings', requireAuth, requirePermission('analytics:read'), getBookings);
router.get('/bookings-by-status', requireAuth, requirePermission('analytics:read'), getBookings);
router.get('/host', requireAuth, requireRole('host'), getHostAnalytics);

export default router;
