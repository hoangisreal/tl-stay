import { Router } from 'express';
import { create, getMyBookings, getHostBookings, cancel, getById, quote } from '../controllers/bookingController.js';
import requireAuth from '../middlewares/requireAuth.js';
import requireRole from '../middlewares/requireRole.js';

const router = Router();

router.get('/quote', quote);
router.post('/', requireAuth, requireRole('guest'), create);
router.get('/me', requireAuth, requireRole('guest'), getMyBookings);
router.get('/host', requireAuth, requireRole('host'), getHostBookings);
router.get('/:id', requireAuth, getById);
router.patch('/:id/cancel', requireAuth, cancel);

export default router;
