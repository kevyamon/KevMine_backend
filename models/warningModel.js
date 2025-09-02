import mongoose from 'mongoose';

const warningSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    suggestedActions: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour retrouver rapidement les avertissements actifs d'un utilisateur
warningSchema.index({ user: 1, isActive: 1 });

const Warning = mongoose.model('Warning', warningSchema);

export default Warning;