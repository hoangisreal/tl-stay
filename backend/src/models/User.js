import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['guest', 'host'], default: 'guest' },
    avatarUrl: { type: String, default: '' },
    favoriteListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
