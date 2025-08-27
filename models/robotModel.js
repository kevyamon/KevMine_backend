import mongoose from 'mongoose';

const robotSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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
      required: false, // Robots in store don't have an owner
    },
  },
  {
    timestamps: true,
  }
);

const Robot = mongoose.model('Robot', robotSchema);

export default Robot;