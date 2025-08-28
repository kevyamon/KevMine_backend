import asyncHandler from 'express-async-handler';
import UserQuest from '../models/userQuestModel.js';
import Quest from '../models/questModel.js';
import User from '../models/userModel.js';
import { assignDailyQuests } from '../utils/questService.js';

// @desc    Get daily quests for the logged-in user
// @route   GET /api/quests
// @access  Private
const getQuestsForUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date().setHours(0, 0, 0, 0);

  // Assigner des quêtes si l'utilisateur n'en a pas pour aujourd'hui
  await assignDailyQuests(userId);

  const userQuests = await UserQuest.find({ user: userId, date: today }).populate(
    'quest'
  );

  res.json(userQuests);
});

// @desc    Claim reward for a completed quest
// @route   POST /api/quests/:id/claim
// @access  Private
const claimQuestReward = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userQuestId = req.params.id;

  const userQuest = await UserQuest.findById(userQuestId).populate('quest');

  if (
    !userQuest ||
    userQuest.user.toString() !== userId.toString()
  ) {
    res.status(404);
    throw new Error('Quête non trouvée.');
  }

  if (!userQuest.isCompleted) {
    res.status(400);
    throw new Error('La quête n\'est pas encore terminée.');
  }

  if (userQuest.isClaimed) {
    res.status(400);
    throw new Error('La récompense a déjà été réclamée.');
  }

  // Mettre à jour le statut de la quête utilisateur
  userQuest.isClaimed = true;
  await userQuest.save();

  // Ajouter la récompense au solde de l'utilisateur
  const user = await User.findById(userId);
  user.keviumBalance += userQuest.quest.reward;
  await user.save();
  
  // Envoyer une notification Socket.io (optionnel)
  if (req.io) {
    const socketId = req.io.getSocketIdByUserId(userId.toString());
    if (socketId) {
        req.io.to(socketId).emit('quest_claimed', {
            questTitle: userQuest.quest.title,
            reward: userQuest.quest.reward
        });
    }
  }

  res.json({
    message: `Récompense de ${userQuest.quest.reward} KVM réclamée !`,
    keviumBalance: user.keviumBalance,
  });
});


// --- ADMIN ROUTES ---

// @desc    Create a new quest
// @route   POST /api/quests/admin
// @access  Private/Admin
const createQuest = asyncHandler(async (req, res) => {
    const { title, description, questType, target, reward } = req.body;

    const quest = new Quest({
        title,
        description,
        questType,
        target,
        reward,
    });

    const createdQuest = await quest.save();
    res.status(201).json(createdQuest);
});

// @desc    Update a quest
// @route   PUT /api/quests/admin/:id
// @access  Private/Admin
const updateQuest = asyncHandler(async (req, res) => {
    const { title, description, questType, target, reward, isActive } = req.body;

    const quest = await Quest.findById(req.params.id);

    if (quest) {
        quest.title = title || quest.title;
        quest.description = description || quest.description;
        quest.questType = questType || quest.questType;
        quest.target = target || quest.target;
        quest.reward = reward || quest.reward;
        quest.isActive = isActive;

        const updatedQuest = await quest.save();
        res.json(updatedQuest);
    } else {
        res.status(404);
        throw new Error('Quête non trouvée');
    }
});

// @desc    Delete a quest
// @route   DELETE /api/quests/admin/:id
// @access  Private/Admin
const deleteQuest = asyncHandler(async (req, res) => {
    const quest = await Quest.findById(req.params.id);

    if (quest) {
        // On pourrait ajouter une vérification pour ne pas supprimer une quête en cours
        await Quest.deleteOne({ _id: quest._id });
        res.json({ message: 'Quête supprimée' });
    } else {
        res.status(404);
        throw new Error('Quête non trouvée');
    }
});

export {
  getQuestsForUser,
  claimQuestReward,
  createQuest,
  updateQuest,
  deleteQuest,
};