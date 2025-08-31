import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // NOUVEAU: Pour savoir si un message a été modifié
    isEdited: {
      type: Boolean,
      default: false,
    },
    // NOUVEAU: Pour une suppression "logique" sans effacer la donnée
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // NOUVEAU: Pour lier un message à celui auquel il répond
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;