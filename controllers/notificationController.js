import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// @desc    Get UNARCHIVED notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ 
    user: req.user._id,
    isArchived: false, // On ne récupère que les non-archivées par défaut
  }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// NOUVEAU : @desc Get ARCHIVED notifications for the logged-in user
// @route   GET /api/notifications/archived
// @access  Private
const getArchivedNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
    isArchived: true,
  }).sort({ createdAt: -1 }).limit(100);
  res.json(notifications);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );
  res.status(200).json({ message: 'Toutes les notifications ont été marquées comme lues.' });
});

// NOUVEAU : @desc Toggle the archive status of a notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
const toggleArchiveNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification non trouvée');
  }

  notification.isArchived = !notification.isArchived;
  await notification.save();

  res.status(200).json(notification);
});


export { getNotifications, getArchivedNotifications, markAllAsRead, toggleArchiveNotification };