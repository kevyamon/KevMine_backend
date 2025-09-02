import Notification from '../models/notificationModel.js';

/**
 * Crée une notification et la pousse en temps réel à l'utilisateur.
 * @param {object} io - L'instance Socket.io.
 * @param {string} userId - L'ID de l'utilisateur qui recevra la notification.
 * @param {string} message - Le message de la notification.
 * @param {string} type - Le type de notification (bonus, quest, etc.).
 * @param {string} [link] - Un lien optionnel pour la redirection ou lier à un autre document.
 */
export const createNotification = async (io, userId, message, type, link) => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type,
      link, // Le lien est maintenant utilisé
    });

    const socketId = io.getSocketIdByUserId(userId.toString());
    if (socketId) {
      io.to(socketId).emit('new_notification', notification);
    }
  } catch (error) {
    console.error(`Erreur lors de la création de la notification pour ${userId}:`, error);
  }
};