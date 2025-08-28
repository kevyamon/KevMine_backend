import mongoose from 'mongoose';

const robotSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // unique n'est pertinent que pour les robots du magasin, pas ceux des joueurs
      // unique: true, 
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
      required: false, // Les robots dans le magasin n'ont pas de propriétaire
    },
    // ---- NOUVEAUX CHAMPS POUR L'AMÉLIORATION ----
    level: {
      type: Number,
      default: 1,
    },
    upgradeCost: {
      type: Number,
      default: 100, // Coût initial pour passer au niveau 2
    },
    levelUpFactor: {
      type: Number,
      default: 1.5, // Facteur de multiplication pour le coût et la puissance
    },
    // ------------------------------------------
  },
  {
    timestamps: true,
  }
);

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;