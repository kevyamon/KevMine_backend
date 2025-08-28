import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Assurons-nous que le pseudo est unique
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false, // On ne le rend pas obligatoire pour l'instant
      unique: true,
      sparse: true, // Important pour permettre plusieurs documents avec une valeur nulle
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
    // ---- AJOUTS POUR LE GAMEPLAY ----
    keviumBalance: {
      type: Number,
      required: true,
      default: 500, // On offre 500 KVM de départ aux nouveaux joueurs
    },
    inventory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Robot',
      },
    ],
    purchaseHistory: [
      {
        robotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Robot' },
        robotName: { type: String },
        price: { type: Number },
        purchaseDate: { type: Date, default: Date.now },
      },
    ],
    // ---- FIN DES AJOUTS ----
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
    this.lockUntil = Date.now() + 10 * 60 * 1000; // Lock for 10 minutes
    this.loginAttempts = 0; // Reset attempts for next cycle
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;