import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['bonus', 'quest', 'sale', 'system', 'warning'],
      default: 'system',
    },
    link: {
      type: String,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // NOUVEAU : Champ pour l'archivage
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;