const express = require('express');
const { startTrip, updateLocation, endTrip, getAllTrips, getMyTrip, getTripByBus } = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorize('admin'), getAllTrips);
router.post('/start', authorize('driver'), startTrip);
router.get('/my-trip', authorize('driver'), getMyTrip);
router.get('/bus/:busId', getTripByBus);
router.put('/:id/location', authorize('driver'), updateLocation);
router.put('/:id/end', authorize('driver'), endTrip);

module.exports = router;
