import { Router } from 'express';
import { list, toggle } from '../controllers/wishlistController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', requireAuth, list);
router.post('/:listingId/toggle', requireAuth, toggle);

export default router;
