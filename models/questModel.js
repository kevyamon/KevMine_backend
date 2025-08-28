import mongoose from 'mongoose';

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    questType: {
      type: String,
      required: true,
      enum: ['MINE_KVM', 'CLAIM_KVM', 'PURCHASE_ROBOT', 'UPGRADE_ROBOT', 'SELL_ROBOT'],
    },
    target: {
      type: Number,
      required: true,
    },
    reward: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Quest = mongoose.model('Quest', questSchema);

export default Quest;