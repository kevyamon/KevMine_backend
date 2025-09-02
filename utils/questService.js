import Quest from '../models/questModel.js';
import UserQuest from '../models/userQuestModel.js';

/**
 * Attribue 3 quêtes quotidiennes aléatoires à un utilisateur s'il n'en a pas pour aujourd'hui.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<void>}
 */
const assignDailyQuests = async (userId) => {
  const today = new Date().setHours(0, 0, 0, 0);

  const existingQuests = await UserQuest.findOne({ user: userId, date: today });

  if (existingQuests) {
    return;
  }

  const activeQuests = await Quest.find({ isActive: true });
  const randomQuests = activeQuests.sort(() => 0.5 - Math.random()).slice(0, 3);

  if (randomQuests.length > 0) {
    const userQuestsToCreate = randomQuests.map((quest) => ({
      user: userId,
      quest: quest._id,
      date: today,
    }));
    await UserQuest.insertMany(userQuestsToCreate);
    console.log(`Assigned ${randomQuests.length} new daily quests to user ${userId}`);
  }
};

/**
 * Met à jour la progression d'une quête pour un utilisateur.
 * @param {object} io - L'instance Socket.io.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} questType - Le type de quête (ex: 'PURCHASE_ROBOT').
 * @param {number} value - La valeur à ajouter à la progression (ex: 1 pour un achat).
 */
const updateQuestProgress = async (io, userId, questType, value = 1) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const userQuests = await UserQuest.find({
      user: userId,
      date: today,
      isCompleted: false,
    }).populate('quest');

    let progressUpdated = false;

    for (const userQuest of userQuests) {
      if (userQuest.quest.questType === questType) {
        userQuest.progress += value;
        progressUpdated = true;

        if (userQuest.progress >= userQuest.quest.target) {
          userQuest.progress = userQuest.quest.target;
          userQuest.isCompleted = true;
        }
        await userQuest.save();
      }
    }

    // Si une progression a eu lieu, on notifie le client en temps réel
    if (progressUpdated && io) {
      const socketId = io.getSocketIdByUserId(userId.toString());
      if (socketId) {
        io.to(socketId).emit('quest_updated');
      }
    }
  } catch (error) {
    console.error(`Failed to update quest progress for user ${userId}:`, error);
  }
};

export { assignDailyQuests, updateQuestProgress };