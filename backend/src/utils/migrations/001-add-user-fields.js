import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Migration: Add new fields to existing users
 * - Add verified object (email, phone, id)
 * - Add phone field
 * - Add preferences object (language, currency)
 */
export async function migrateUsers() {
  try {
    console.log('Starting user migration...');

    const result = await User.updateMany(
      {
        $or: [
          { verified: { $exists: false } },
          { phone: { $exists: false } },
          { preferences: { $exists: false } },
        ],
      },
      {
        $set: {
          verified: {
            email: false,
            phone: false,
            id: false,
          },
          phone: '',
          preferences: {
            language: 'vi',
            currency: 'VND',
          },
        },
      }
    );

    console.log(`Migration completed: ${result.modifiedCount} users updated`);
    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tl-stay';
  
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await migrateUsers();
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}
