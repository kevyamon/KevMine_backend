import mongoose from 'mongoose';

const robotSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Ajout pour enlever les espaces inutiles
    },
    icon: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    miningPower: {
      type: Number,
      required: true,
      default: 1, // KVM/hour
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      required: true,
      default: 'common',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    isSponsored: {
      type: Boolean,
      required: true,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    // NOUVEAU : Ajout du champ pour identifier le vendeur
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    level: {
      type: Number,
      default: 1,
    },
    upgradeCost: {
      type: Number,
      default: 100,
    },
    levelUpFactor: {
      type: Number,
      default: 1.5,
    },
    isPlayerSale: {
      type: Boolean,
      default: false,
    },
    investedKevium: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// CORRECTION : Création d'un index partiel.
// Le nom du robot est unique UNIQUEMENT pour les robots de la boutique (ceux sans propriétaire).
robotSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { owner: null } });

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;