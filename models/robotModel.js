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
    isPlayerSale: {
      type: Boolean,
      default: false,
    },
    // ---- MODIFICATION CLÉ ----
    // Ce champ remplacera 'salePrice' et gardera la trace de l'investissement total
    investedKevium: {
      type: Number,
      default: 0,
    },
    // -------------------------
  },
  {
    timestamps: true,
  }
);

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;