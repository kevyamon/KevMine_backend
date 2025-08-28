import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    photo: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'inactive'],
      default: 'active',
    },
    // ---- GAMEPLAY FIELDS ----
    keviumBalance: {
      type: Number,
      required: true,
      default: 500,
    },
    unclaimedKevium: {
      type: Number,
      default: 0,
    },
    lastKvmUpdate: {
      type: Date,
      default: Date.now,
    },
    inventory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Robot',
      },
    ],
    purchaseHistory: [
      {
        robotName: { type: String },
        price: { type: Number },
        purchaseDate: { type: Date, default: Date.now },
      },
    ],
    salesHistory: [
      {
        robotName: { type: String },
        salePrice: { type: Number },
        userRevenue: { type: Number },
        saleDate: { type: Date, default: Date.now },
      }
    ],
    // ---- NOUVEAUX CHAMPS POUR LE CLASSEMENT ----
    rank: {
      type: Number,
      default: 0, // 0 signifie non classé
    },
    previousRank: {
      type: Number,
      default: 0, // Le rang de la période précédente
    },
    // ---------------------------------------------
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = async function () {
  if (this.isLocked) {
    throw new Error('Too many failed login attempts. Try again later.');
  }
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 10 * 60 * 1000;
    this.loginAttempts = 0;
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;