import asyncHandler from 'express-async-handler';
import UserQuest from '../models/userQuestModel.js';
import Quest from '../models/questModel.js';
import User from '../models/userModel.js';
import { assignDailyQuests } from '../utils/questService.js';
import { createNotification } from '../utils/notificationService.js';

// @desc    Get all quests for admin panel
// @route   GET /api/quests/admin/all
// @access  Private/Admin
const getAllQuests = asyncHandler(async (req, res) => {
  const quests = await Quest.find({});
  res.json(quests);
});

// @desc    Get quests for a user
// @route   GET /api/quests
// @access  Private
const getQuestsForUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = new Date().setHours(0, 0, 0, 0);

  await assignDailyQuests(userId);

  const userQuests = await UserQuest.find({ user: userId, date: today }).populate(
    'quest'
  );

  res.json(userQuests);
});


const claimQuestReward = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userQuestId = req.params.id;

  const userQuest = await UserQuest.findById(userQuestId).populate('quest');

  if (!userQuest || userQuest.user.toString() !== userId.toString()) {
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

  userQuest.isClaimed = true;
  await userQuest.save();

  const user = await User.findById(userId);
  user.keviumBalance += userQuest.quest.reward;
  await user.save();
  
  await createNotification(
    req.io,
    userId,
    `Quête terminée : "${userQuest.quest.title}". Vous avez gagné ${userQuest.quest.reward} KVM !`,
    'quest'
  );

  res.json({
    message: `Récompense de ${userQuest.quest.reward} KVM réclamée !`,
    keviumBalance: user.keviumBalance,
  });
});

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

const deleteQuest = asyncHandler(async (req, res) => {
    const quest = await Quest.findById(req.params.id);

    if (quest) {
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
  getAllQuests, // On exporte la nouvelle fonction
};