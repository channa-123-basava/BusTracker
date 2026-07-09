const express = require('express');
const { getAllRoutes, getRoute, createRoute, updateRoute, deleteRoute } = require('../controllers/routeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllRoutes);
router.get('/:id', getRoute);
router.post('/', authorize('admin'), createRoute);
router.put('/:id', authorize('admin'), updateRoute);
router.delete('/:id', authorize('admin'), deleteRoute);

module.exports = router;
