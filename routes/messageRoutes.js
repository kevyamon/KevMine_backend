import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  findOrCreateConversation,
  markConversationAsRead, // 1. Importer la nouvelle fonction
} from '../controllers/messageController.js';

const router = express.Router();

// Routes protégées
router.route('/conversations').get(protect, getConversations);
router.route('/conversations/findOrCreate').post(protect, findOrCreateConversation);
router.route('/conversations/:conversationId/read').put(protect, markConversationAsRead); // 2. Ajouter la nouvelle route
router.route('/send/:receiverId').post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

export default router;