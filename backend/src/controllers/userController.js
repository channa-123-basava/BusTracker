const User = require('../models/User');
const Bus = require('../models/Bus');
const { sendSuccess, sendError } = require('../utils/response');

const normalizePhone = (phone) => (phone || '').trim().replace(/[\s()-]/g, '');

// ─── STUDENTS ────────────────────────────────────────────────────────────────

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).populate('assignedBus', 'busNumber registrationNumber');
    return sendSuccess(res, { students, count: students.length }, 'Students fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const getStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).populate('assignedBus');
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student }, 'Student fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, studentId, department, year } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already registered.', 400);
    const student = await User.create({ name, email, password, phone, studentId, department, year, role: 'student' });
    return sendSuccess(res, { student }, 'Student created.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

const updateStudent = async (req, res) => {
  try {
    const { password, role, ...updateData } = req.body; // prevent role/password changes via this route
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedBus');
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student }, 'Student updated.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, {}, 'Student deleted.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const assignBusToStudent = async (req, res) => {
  try {
    const { busId } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return sendError(res, 'Bus not found.', 404);
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { assignedBus: busId },
      { new: true }
    ).populate('assignedBus');
    if (!student) return sendError(res, 'Student not found.', 404);
    return sendSuccess(res, { student }, 'Bus assigned to student.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

// ─── DRIVERS ────────────────────────────────────────────────────────────────

const getAllDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).populate('assignedBusDriver', 'busNumber registrationNumber');
    return sendSuccess(res, { drivers, count: drivers.length }, 'Drivers fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const getDriver = async (req, res) => {
  try {
    const driver = await User.findOne({ _id: req.params.id, role: 'driver' }).populate('assignedBusDriver');
    if (!driver) return sendError(res, 'Driver not found.', 404);
    return sendSuccess(res, { driver }, 'Driver fetched.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, password, phone, licenseNumber } = req.body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return sendError(res, 'Phone number is required.', 400);

    const existing = await User.findOne({ phone: normalizedPhone });
    if (existing) return sendError(res, 'Phone number is already registered.', 400);

    // Keep a unique internal email so existing MongoDB email indexes continue
    // to work, while drivers only need to provide a phone number.
    const internalEmail = `driver-${normalizedPhone.replace(/\D/g, '')}@phone.local`;
    const driver = await User.create({
      name,
      email: internalEmail,
      password,
      phone: normalizedPhone,
      licenseNumber,
      role: 'driver',
    });
    return sendSuccess(res, { driver }, 'Driver created.', 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

const updateDriver = async (req, res) => {
  try {
    const { password, role, ...updateData } = req.body;
    const driver = await User.findOne({ _id: req.params.id, role: 'driver' });
    if (!driver) return sendError(res, 'Driver not found.', 404);

    if (updateData.phone !== undefined) {
      const normalizedPhone = normalizePhone(updateData.phone);
      if (!normalizedPhone) return sendError(res, 'Phone number is required.', 400);
      const existing = await User.findOne({ phone: normalizedPhone, _id: { $ne: driver._id } });
      if (existing) return sendError(res, 'Phone number is already registered.', 400);
      updateData.phone = normalizedPhone;
    }

    Object.assign(driver, updateData);
    // Saving the document runs the password-hashing middleware when a new
    // password was supplied from the admin edit form.
    if (password) driver.password = password;
    await driver.save();

    const updatedDriver = await User.findById(driver._id).populate('assignedBusDriver');
    return sendSuccess(res, { driver: updatedDriver }, 'Driver updated.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const deleteDriver = async (req, res) => {
  try {
    const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
    if (!driver) return sendError(res, 'Driver not found.', 404);
    return sendSuccess(res, {}, 'Driver deleted.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

const assignBusToDriver = async (req, res) => {
  try {
    const { busId, assignedDate, notes } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return sendError(res, 'Bus not found.', 404);

    const driver = await User.findOne({ _id: req.params.id, role: 'driver' });
    if (!driver) return sendError(res, 'Driver not found.', 404);

    const normalizedDate = assignedDate ? new Date(assignedDate) : new Date();
    normalizedDate.setHours(12, 0, 0, 0);

    const hasTodayAssignment = driver.assignmentHistory?.some((entry) => {
      const entryDate = entry.assignedDate ? new Date(entry.assignedDate) : null;
      if (!entryDate) return false;
      return entry.bus?.toString() === busId && entryDate.toDateString() === normalizedDate.toDateString();
    });

    if (!hasTodayAssignment) {
      driver.assignmentHistory.push({
        bus: busId,
        assignedDate: normalizedDate,
        assignedBy: req.user?._id,
        notes: notes || '',
      });
    }

    driver.assignedBusDriver = busId;
    await driver.save();

    await Bus.findByIdAndUpdate(busId, { assignedDriver: driver._id });
    const updatedDriver = await User.findOne({ _id: driver._id, role: 'driver' }).populate('assignedBusDriver');

    return sendSuccess(res, { driver: updatedDriver }, 'Bus assigned to driver for the selected day.');
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  getAllStudents, getStudent, createStudent, updateStudent, deleteStudent, assignBusToStudent,
  getAllDrivers, getDriver, createDriver, updateDriver, deleteDriver, assignBusToDriver,
};
