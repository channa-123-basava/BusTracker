const express = require('express');
const {
  getAllBuses,
  getBus,
  createBus,
  updateBus,
  deleteBus,
  assignRoute,
  getActiveBuses,
  getDriverBuses,
} = require('../controllers/busController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/driver', authorize('driver'), getDriverBuses);

router.get('/active', getActiveBuses);
router.get('/', authorize('admin'), getAllBuses);
router.post('/', authorize('admin'), createBus);
router.get('/:id', getBus);
router.put('/:id', authorize('admin'), updateBus);
router.delete('/:id', authorize('admin'), deleteBus);
router.put('/:id/assign-route', authorize('admin'), assignRoute);

module.exports = router;
