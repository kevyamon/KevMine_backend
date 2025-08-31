import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  findOrCreateConversation,
  markConversationAsRead,
  editMessage,     // 1. Importer
  deleteMessage,   // 1. Importer
} from '../controllers/messageController.js';

const router = express.Router();

// Routes pour les conversations
router.route('/conversations').get(protect, getConversations);
router.route('/conversations/findOrCreate').post(protect, findOrCreateConversation);
router.route('/conversations/:conversationId/read').put(protect, markConversationAsRead);

// Routes pour les messages
router.route('/send/:receiverId').post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

// 2. Ajouter les nouvelles routes pour l'édition et la suppression
router.route('/:messageId')
  .put(protect, editMessage)
  .delete(protect, deleteMessage);

export default router;