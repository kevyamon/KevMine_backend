import mongoose from 'mongoose';

const warningSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // CORRECTION : Renommé 'admin' en 'sender' pour plus de clarté.
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Le nom 'suggestedActions' est conservé car il correspond bien
    // à ce que l'admin "suggère" à l'utilisateur.
    suggestedActions: [
      {
        type: String,
      },
    ],
    // CORRECTION : Remplacé 'isActive' par un statut pour plus de flexibilité.
    status: {
      type: String,
      enum: ['active', 'dismissed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour retrouver rapidement les avertissements actifs d'un utilisateur
warningSchema.index({ user: 1, status: 1 });

const Warning = mongoose.model('Warning', warningSchema);

export default Warning;