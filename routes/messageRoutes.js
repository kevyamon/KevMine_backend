import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendMessage,
  getMessages,
  getConversations,
  findOrCreateConversation,
  markConversationAsRead,
  editMessage,
  deleteMessage,
  getArchivedConversations, // 1. Importer
  toggleArchiveConversation, // 1. Importer
} from '../controllers/messageController.js';

const router = express.Router();

// Routes pour les conversations
router.route('/conversations').get(protect, getConversations);
router.route('/conversations/archived').get(protect, getArchivedConversations); // 2. Ajouter
router.route('/conversations/findOrCreate').post(protect, findOrCreateConversation);
router.route('/conversations/:conversationId/read').put(protect, markConversationAsRead);
router.route('/conversations/:conversationId/archive').put(protect, toggleArchiveConversation); // 2. Ajouter

// Routes pour les messages
router.route('/send/:receiverId').post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

router.route('/:messageId')
  .put(protect, editMessage)
  .delete(protect, deleteMessage);

export default router;