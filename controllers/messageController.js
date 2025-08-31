import asyncHandler from 'express-async-handler';
import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// ... (sendMessage, editMessage, deleteMessage, findOrCreateConversation, getMessages, markConversationAsRead restent inchangées)

// @desc    Get all NON-ARCHIVED conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // MODIFICATION: On ne récupère que les conversations où l'ID de l'utilisateur n'est PAS dans `archivedBy`
  const conversations = await Conversation.find({ 
      participants: userId,
      archivedBy: { $ne: userId } 
    })
    .populate({
      path: 'participants',
      select: 'name photo',
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name',
      },
    })
    .sort({ updatedAt: -1 });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (convo) => {
      const unreadCount = await Message.countDocuments({
        conversationId: convo._id,
        isRead: false,
        sender: { $ne: userId },
      });
      return { ...convo.toObject(), unreadCount };
    })
  );

  res.status(200).json(conversationsWithUnread);
});

// NOUVEAU: @desc    Get ARCHIVED conversations for a user
// @route   GET /api/messages/conversations/archived
// @access  Private
const getArchivedConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await Conversation.find({ 
        participants: userId,
        archivedBy: userId // On récupère celles où l'utilisateur EST dans `archivedBy`
    })
    .populate({ path: 'participants', select: 'name photo' })
    .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name' }})
    .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
});

// NOUVEAU: @desc    Toggle archive status for a conversation
// @route   PUT /api/messages/conversations/:conversationId/archive
// @access  Private
const toggleArchiveConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation non trouvée.');
    }

    const isArchived = conversation.archivedBy.includes(userId);

    if (isArchived) {
        // On la désarchive en retirant l'ID de l'utilisateur
        conversation.archivedBy.pull(userId);
    } else {
        // On l'archive en ajoutant l'ID de l'utilisateur
        conversation.archivedBy.push(userId);
    }

    await conversation.save();
    res.status(200).json({ message: `Conversation ${isArchived ? 'désarchivée' : 'archivée'}.` });
});


// Fonctions existantes...
const findOrCreateConversation = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (!receiverId) {
    res.status(400);
    throw new Error('ID du destinataire manquant.');
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  res.status(200).json(conversation);
});

const sendMessage = asyncHandler(async (req, res) => {
  const { text, replyTo } = req.body;
  const { receiverId } = req.params;
  const senderId = req.user._id;

  if (!text) {
    res.status(400);
    throw new Error('Le message ne peut pas être vide.');
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  const newMessage = new Message({
    conversationId: conversation._id,
    sender: senderId,
    text,
    replyTo: replyTo || null,
  });

  await newMessage.save();

  conversation.lastMessage = newMessage._id;
  await conversation.save();

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', 'name photo')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    });


  const receiverSocketId = req.io.getSocketIdByUserId(receiverId);
  if (receiverSocketId) {
    req.io.to(receiverSocketId).emit('newMessage', populatedMessage);
  }
  
  const senderSocketId = req.io.getSocketIdByUserId(senderId.toString());
  if (senderSocketId) {
      req.io.to(senderSocketId).emit('newMessage', populatedMessage);
  }

  res.status(201).json(populatedMessage);
});

const editMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message non trouvé.');
  }
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Vous n\'êtes pas autorisé à modifier ce message.');
  }

  message.text = text;
  message.isEdited = true;
  await message.save();
  
  const conversation = await Conversation.findById(message.conversationId).populate('participants');

  conversation.participants.forEach(participant => {
    const socketId = req.io.getSocketIdByUserId(participant._id.toString());
    if (socketId) {
        req.io.to(socketId).emit('messageUpdated', message);
    }
  });


  res.status(200).json(message);
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message non trouvé.');
  }
  if (message.sender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce message.');
  }

  message.isDeleted = true;
  message.text = "Ce message a été supprimé";
  await message.save();
  
  const conversation = await Conversation.findById(message.conversationId).populate('participants');
  
  conversation.participants.forEach(participant => {
    const socketId = req.io.getSocketIdByUserId(participant._id.toString());
    if (socketId) {
        req.io.to(socketId).emit('messageUpdated', message);
    }
  });

  res.status(200).json({ message: 'Message supprimé avec succès.' });
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversationId })
    .populate('sender', 'name photo')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    });
  res.status(200).json(messages);
});

const markConversationAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  await Message.updateMany(
    { conversationId: conversationId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({ message: 'Messages marqués comme lus.' });
});

export { sendMessage, getMessages, getConversations, findOrCreateConversation, markConversationAsRead, editMessage, deleteMessage, getArchivedConversations, toggleArchiveConversation };