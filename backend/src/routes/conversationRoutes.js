import { Router } from 'express';
import {
  createOrGetConversation,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
} from '../controllers/conversationController.js';
import requireAuth from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listConversations);
router.post('/', createOrGetConversation);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markRead);

export default router;
