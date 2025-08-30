import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
} from '../controllers/messageController.js';

const router = express.Router();

// Routes protégées car seul un utilisateur connecté peut utiliser la messagerie
router.route('/conversations').get(protect, getConversations);
router.route('/send/:receiverId').post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

export default router;