import mongoose from 'mongoose';

const robotSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

// CORRECTION : L'index partiel est maintenant plus spécifique.
// Le nom du robot est unique UNIQUEMENT s'il n'a pas de propriétaire ET que ce n'est pas une revente de joueur.
robotSchema.index({ name: 1 }, { unique: true, partialFilterExpression: { owner: null, isPlayerSale: false } });

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;