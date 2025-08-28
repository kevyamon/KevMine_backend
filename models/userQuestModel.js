import mongoose from 'mongoose';

const userQuestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    // Ajout d'une date pour s'assurer que les quêtes sont bien quotidiennes
    date: {
        type: Date,
        default: () => new Date().setHours(0, 0, 0, 0), // Met la date au début du jour
    }
  },
  {
    timestamps: true,
  }
);

// Index pour accélérer la recherche des quêtes d'un utilisateur pour une date donnée
userQuestSchema.index({ user: 1, date: 1 });

const UserQuest = mongoose.model('UserQuest', userQuestSchema);

export default UserQuest;