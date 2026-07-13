const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const normalizePhone = (phone) => (phone || '').trim().replace(/[\s()-]/g, '');

// Matches phone numbers saved with common formatting such as spaces, hyphens,
// parentheses, or an optional leading +. This keeps older registrations
// searchable while new registrations are stored in a normalized format.
const formattedPhonePattern = (phone) => {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return new RegExp(`^\\s*\\+?[\\s()-]*${digits.split('').join('[\\s()-]*')}\\s*$`);
};

// @desc    Register student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { name, email, password, phone, studentId, department, year } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 'Email already registered.', 400);
    }
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizePhone(phone),
      studentId,
      department,
      year,
      role: 'student',
    });
    const token = generateToken(user._id, user.role);
    return sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentId: user.studentId,
          department: user.department,
        },
      },
      'Registration successful.',
      201
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Login user (student/driver/admin)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { identifier, email, phone, password } = req.body;
    const loginIdentifier = (identifier || email || phone || '').trim();
    const isEmailLogin = loginIdentifier.includes('@');
    const normalizedPhone = normalizePhone(loginIdentifier);
    const userQuery = isEmailLogin
      ? { email: loginIdentifier.toLowerCase() }
      : {
        $or: [
          { phone: normalizedPhone },
          { phone: formattedPhonePattern(loginIdentifier) },
        ],
      };

    console.log(`Login attempt from ${req.ip}`);
    const user = await User.findOne(userQuery).select('+password')
      .populate({ path: 'assignedBus', populate: { path: 'assignedRoute' } })
      .populate({ path: 'assignedBusDriver', populate: { path: 'assignedRoute' } });
    console.log(`User lookup: ${user ? 'found' : 'not found'}`);
    if (!user) {
      return sendError(res, 'Invalid credentials.', 401);
    }
    const isMatch = await user.comparePassword(password);
    console.log(`Password match: ${isMatch}`);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials.', 401);
    }
    if (!user.isActive) {
      return sendError(res, 'Account deactivated. Please contact administrator.', 403);
    }
    const token = generateToken(user._id, user.role);
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };
    if (user.role === 'student') {
      userData.studentId = user.studentId;
      userData.department = user.department;
      userData.year = user.year;
      userData.assignedBus = user.assignedBus;
    }
    if (user.role === 'driver') {
      userData.licenseNumber = user.licenseNumber;
      userData.assignedBus = user.assignedBusDriver;
      userData.isOnTrip = user.isOnTrip;
    }
    return sendSuccess(res, { token, user: userData }, 'Login successful.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({ path: 'assignedBus', populate: { path: 'assignedRoute' } })
      .populate({ path: 'assignedBusDriver', populate: { path: 'assignedRoute' } });
    return sendSuccess(res, { user }, 'User fetched successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect.', 400);
    }
    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id, user.role);
    return sendSuccess(res, { token }, 'Password updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Reset admin password with secret key
// @route   POST /api/auth/reset-admin-password
// @access  Public
const resetAdminPassword = async (req, res) => {
  try {
    const { email, newPassword, adminKey } = req.body;
    if (!adminKey || adminKey !== process.env.ADMIN_RESET_KEY) {
      return sendError(res, 'Unauthorized. Provide the admin reset key.', 401);
    }
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      return sendError(res, 'Admin user not found.', 404);
    }
    user.password = newPassword;
    await user.save();
    return sendSuccess(res, {}, 'Admin password updated successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Send password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return sendSuccess(res, {}, 'If the email exists, a password reset link has been sent.');
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // In production, replace this with an email service
    console.log(`Password reset link for ${user.email}: ${resetUrl}`);

    return sendSuccess(
      res,
      { resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined },
      'Password reset link sent. Check console or email if configured.'
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const resetToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return sendError(res, 'Token is invalid or has expired.', 400);
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };
    if (user.role === 'student') {
      userData.studentId = user.studentId;
      userData.department = user.department;
      userData.year = user.year;
      userData.assignedBus = user.assignedBus;
    }
    if (user.role === 'driver') {
      userData.licenseNumber = user.licenseNumber;
      userData.assignedBus = user.assignedBusDriver;
      userData.isOnTrip = user.isOnTrip;
    }

    return sendSuccess(res, { token, user: userData }, 'Password has been reset successfully.');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = { registerStudent, loginUser, getMe, updatePassword, resetAdminPassword, forgotPassword, resetPassword };
