import { Router } from 'express';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/unread/count', getUnreadCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/mark-all-read', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
