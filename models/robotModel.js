import mongoose from 'mongoose';

const robotSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    // ---- NOUVEAUX CHAMPS POUR LA VENTE PAR LES JOUEURS ----
    isPlayerSale: {
      type: Boolean,
      default: false, // Vrai si le robot est une revente d'un joueur
    },
    salePrice: {
      type: Number, // Le prix fixé par le joueur pour la revente
      required: false,
    },
    // ----------------------------------------------------
  },
  {
    timestamps: true,
  }
);

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;