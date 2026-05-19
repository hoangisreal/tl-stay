import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import Listing from './models/Listing.js';
import { seedDemoData } from './utils/seed.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    const shouldSeed =
      process.env.NODE_ENV !== 'production' &&
      process.env.SEED_DEMO_ON_EMPTY !== 'false' &&
      (await Listing.countDocuments()) === 0;

    if (shouldSeed) {
      console.log('Database is empty. Seeding demo data...');
      await seedDemoData({ reset: false });
    }
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
