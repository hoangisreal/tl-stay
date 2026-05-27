import mongoose from 'mongoose';
import { USER_ROLES } from '../config/permissions.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'guest',
      index: true,
    },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    verified: {
      email: { type: Boolean, default: false, index: true },
      phone: { type: Boolean, default: false },
      id: { type: Boolean, default: false },
    },
    preferences: {
      language: { type: String, enum: ['vi', 'en'], default: 'vi' },
      currency: { type: String, enum: ['VND', 'USD'], default: 'VND' },
    },
    favoriteListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
