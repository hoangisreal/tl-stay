import { Router } from 'express';
import {
  create, getAll, getById, update, deleteListing, getByHost, getAvailability,
} from '../controllers/listingController.js';
import requireAuth from '../middlewares/requireAuth.js';
import requireRole from '../middlewares/requireRole.js';
import checkListingOwner from '../middlewares/checkListingOwner.js';
import upload from '../utils/upload.js';

const router = Router();

router.get('/', getAll);
router.get('/host/me', requireAuth, requireRole('host'), getByHost);
router.get('/:id', getById);
router.get('/:id/availability', getAvailability);
router.post('/', requireAuth, requireRole('host'), upload.array('images', 10), create);
router.put('/:id', requireAuth, requireRole('host'), checkListingOwner, upload.array('images', 10), update);
router.delete('/:id', requireAuth, requireRole('host'), checkListingOwner, deleteListing);

export default router;
