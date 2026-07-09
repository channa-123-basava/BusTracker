const express = require('express');
const {
  getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, assignBusToStudent,
  getAllDrivers, getDriver, createDriver, updateDriver, deleteDriver, assignBusToDriver,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// Students
router.get('/students', getAllStudents);
router.post('/students', createStudent);
router.get('/students/:id', getStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/:id/assign-bus', assignBusToStudent);

// Drivers
router.get('/drivers', getAllDrivers);
router.post('/drivers', createDriver);
router.get('/drivers/:id', getDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);
router.put('/drivers/:id/assign-bus', assignBusToDriver);

module.exports = router;
