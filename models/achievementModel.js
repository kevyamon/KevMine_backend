import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: 'default_achievement_icon.png',
    },
    achievementType: {
      type: String,
      required: true,
      enum: [
        'TOTAL_KVM_EARNED', // KVM total gagné (minage + bonus + ventes)
        'ROBOTS_OWNED',     // Nombre de robots possédés simultanément
        'ROBOTS_PURCHASED', // Nombre total de robots achetés
        'ROBOTS_SOLD',      // Nombre total de robots vendus
        'ROBOTS_UPGRADED',  // Nombre total d'améliorations effectuées
        'KVM_BALANCE',      // Atteindre un certain solde de KVM
      ],
    },
    target: {
      type: Number,
      required: true,
    },
    reward: {
      type: Number,
      default: 0, // Récompense en KVM (optionnelle)
    },
    isEnabled: {
      type: Boolean,
      default: true, // Pour activer/désactiver un succès
    },
  },
  {
    timestamps: true,
  }
);

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;