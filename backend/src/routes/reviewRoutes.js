import { Router } from 'express';
import { create, listByListing, remove, myPendingReviews } from '../controllers/reviewController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

router.get('/listing/:listingId', listByListing);
router.get('/me/pending', requireAuth, myPendingReviews);
router.post('/', requireAuth, create);
router.delete('/:id', requireAuth, remove);

export default router;
