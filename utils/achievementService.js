import Achievement from '../models/achievementModel.js';
import UserAchievement from '../models/userAchievementModel.js';
import User from '../models/userModel.js';
import { createNotification } from './notificationService.js';

/**
 * Initialise les succès pour un nouvel utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 */
export const initializeAchievementsForUser = async (userId) => {
  try {
    const allAchievements = await Achievement.find({ isEnabled: true });
    const userAchievementsToCreate = allAchievements.map(ach => ({
      user: userId,
      achievement: ach._id,
    }));

    if (userAchievementsToCreate.length > 0) {
      await UserAchievement.insertMany(userAchievementsToCreate);
    }
  } catch (error) {
    console.error(`Erreur lors de l'initialisation des succès pour l'utilisateur ${userId}:`, error);
  }
};

/**
 * Met à jour la progression d'un succès pour un utilisateur.
 * @param {object} io - L'instance Socket.io.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} achievementType - Le type de succès (ex: 'ROBOTS_PURCHASED').
 * @param {number} value - La valeur à utiliser pour la progression.
 */
export const updateAchievementProgress = async (io, userId, achievementType, value) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Trouve tous les succès de ce type qui ne sont pas encore débloqués par l'utilisateur
    const achievements = await Achievement.find({ achievementType, isEnabled: true });

    for (const ach of achievements) {
      const userAch = await UserAchievement.findOne({
        user: userId,
        achievement: ach._id,
        isUnlocked: false,
      });

      if (userAch) {
        // La progression est définie par la nouvelle valeur (ex: solde total, nombre de robots)
        userAch.progress = value;

        if (userAch.progress >= ach.target) {
          userAch.isUnlocked = true;
          userAch.unlockedAt = new Date();
          userAch.progress = ach.target; // On plafonne au cas où

          await userAch.save();

          // Appliquer la récompense si elle existe
          if (ach.reward > 0) {
            user.keviumBalance += ach.reward;
            await user.save();
          }

          // Notifier l'utilisateur
          await createNotification(
            io,
            userId,
            `Succès débloqué : "${ach.title}" ! ${ach.reward > 0 ? `Vous gagnez ${ach.reward} KVM !` : ''}`,
            'quest' // On peut réutiliser le type 'quest' pour l'icône
          );
        } else {
            await userAch.save();
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour des succès pour ${userId}:`, error);
  }
};