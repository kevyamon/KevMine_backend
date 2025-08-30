import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  findOrCreateConversation, // 1. Importer la nouvelle fonction
} from '../controllers/messageController.js';

const router = express.Router();

// Routes protégées car seul un utilisateur connecté peut utiliser la messagerie
router.route('/conversations').get(protect, getConversations);
router.route('/conversations/findOrCreate').post(protect, findOrCreateConversation); // 2. Ajouter la nouvelle route
router.route('/send/:receiverId').post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

export default router;