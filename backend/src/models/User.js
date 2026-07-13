const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'driver', 'admin'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Student specific fields
    studentId: {
      type: String,
      sparse: true,
    },
    department: {
      type: String,
    },
    year: {
      type: Number,
      min: 1,
      max: 6,
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    // Driver specific fields
    licenseNumber: {
      type: String,
    },
    assignedBusDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
    },
    assignmentHistory: [
      {
        bus: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bus',
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: {
          type: String,
          default: '',
        },
      },
    ],
    isOnTrip: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    fcmToken: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (this.isModified('phone') && this.phone) {
    this.phone = this.phone.trim().replace(/[\s()-]/g, '');
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};
module.exports = mongoose.model('User', userSchema);
