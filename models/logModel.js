import mongoose from 'mongoose';

const logSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Could be a public action without a logged-in user
    },
    action: {
      type: String,
      required: true,
      enum: ['login_success', 'login_fail', 'password_reset', 'user_banned', 'user_unbanned', 'admin_promotion'],
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