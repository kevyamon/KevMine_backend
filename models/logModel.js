import mongoose from 'mongoose';

const logSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    action: {
      type: String,
      required: true,
      // CORRECTION : Ajout des nouveaux statuts possibles
      enum: [
        'login_success', 
        'login_fail', 
        'password_reset', 
        'user_banned', 
        'user_unbanned', // Gardé pour rétrocompatibilité potentielle
        'admin_promotion',
        'user_suspended',
        'user_active'
      ],
    },
    description: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    ip: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Log = mongoose.model('Log', logSchema);

export default Log;