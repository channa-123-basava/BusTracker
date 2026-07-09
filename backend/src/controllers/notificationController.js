const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipients: req.user._id },
        { isGlobal: true },
      ],
    })
      .populate('bus', 'busNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { notifications, count: notifications.length }, 'Notifications fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });
    return sendSuccess(res, {}, 'Marked as read.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipients: req.user._id }, { isGlobal: true }],
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );
    return sendSuccess(res, {}, 'All notifications marked as read.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// @desc    Create a broadcast notification (admin)
// @route   POST /api/notifications
// @access  Private (admin)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, isGlobal, recipients } = req.body;
    const notification = await Notification.create({
      title,
      message,
      type: type || 'general',
      isGlobal: isGlobal || false,
      recipients: recipients || [],
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      if (isGlobal) {
        io.emit('new_notification', notification);
      } else if (recipients && recipients.length > 0) {
        recipients.forEach((userId) => {
          io.to(`user_${userId}`).emit('new_notification', notification);
        });
      }
    }

    return sendSuccess(res, { notification }, 'Notification sent.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, createNotification };
