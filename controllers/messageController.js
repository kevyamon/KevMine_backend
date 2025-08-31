import asyncHandler from 'express-async-handler';
import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// ... (findOrCreateConversation, getMessages, getConversations, markConversationAsRead restent inchangées)

// @desc    Send a message (UPDATED for replies)
// @route   POST /api/messages/send/:receiverId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { text, replyTo } = req.body; // Ajout de replyTo
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
    replyTo: replyTo || null, // On sauvegarde l'ID du message auquel on répond
  });

  await newMessage.save();

  conversation.lastMessage = newMessage._id;
  await conversation.save();

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('sender', 'name photo')
    .populate({ // On peuple aussi le message de réponse
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    });


  const receiverSocketId = req.io.getSocketIdByUserId(receiverId);
  if (receiverSocketId) {
    req.io.to(receiverSocketId).emit('newMessage', populatedMessage);
  }
  
  // On s'envoie aussi le message pour avoir le message peuplé instantanément
  const senderSocketId = req.io.getSocketIdByUserId(senderId.toString());
  if (senderSocketId) {
      req.io.to(senderSocketId).emit('newMessage', populatedMessage);
  }

  res.status(201).json(populatedMessage);
});

// NOUVEAU: @desc    Edit a message
// @route   PUT /api/messages/:messageId
// @access  Private
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

  // Envoyer une notification de mise à jour à tous les participants
  conversation.participants.forEach(participant => {
    const socketId = req.io.getSocketIdByUserId(participant._id.toString());
    if (socketId) {
        req.io.to(socketId).emit('messageUpdated', message);
    }
  });


  res.status(200).json(message);
});

// NOUVEAU: @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
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
  
  // Envoyer une notification de mise à jour à tous les participants
  conversation.participants.forEach(participant => {
    const socketId = req.io.getSocketIdByUserId(participant._id.toString());
    if (socketId) {
        req.io.to(socketId).emit('messageUpdated', message);
    }
  });

  res.status(200).json({ message: 'Message supprimé avec succès.' });
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

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversationId })
    .populate('sender', 'name photo')
    .populate({ // On peuple aussi le message de réponse quand on charge l'historique
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    });
  res.status(200).json(messages);
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({ participants: userId })
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

const markConversationAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  await Message.updateMany(
    { conversationId: conversationId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({ message: 'Messages marqués comme lus.' });
});

export { sendMessage, getMessages, getConversations, findOrCreateConversation, markConversationAsRead, editMessage, deleteMessage };