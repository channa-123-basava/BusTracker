const express = require('express');
const { getMyNotifications, markAsRead, markAllAsRead, createNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post('/', authorize('admin'), createNotification);

module.exports = router;
