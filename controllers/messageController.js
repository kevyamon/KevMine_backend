import asyncHandler from 'express-async-handler';
import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';

// @desc    Find or create a conversation with another user
// @route   POST /api/messages/conversations/findOrCreate
// @access  Private
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

// @desc    Send a message
// @route   POST /api/messages/send/:receiverId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
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
  });

  await newMessage.save();

  // Mettre à jour le dernier message de la conversation
  conversation.lastMessage = newMessage._id;
  await conversation.save();

  // Logique Socket.io pour l'envoi en temps réel
  const receiverSocketId = req.io.getSocketIdByUserId(receiverId);
  if (receiverSocketId) {
    req.io.to(receiverSocketId).emit('newMessage', newMessage);
  }

  res.status(201).json(newMessage);
});

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const messages = await Message.find({ conversationId }).populate('sender', 'name photo');
  res.status(200).json(messages);
});

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
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

  res.status(200).json(conversations);
});

export { sendMessage, getMessages, getConversations, findOrCreateConversation };