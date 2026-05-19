import mongoose from 'mongoose';

let memoryServer;

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI;

  if (!mongoUri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI is not set');
  }

  if (!mongoUri) {
    if (process.platform === 'linux') {
      process.env.MONGOMS_DISTRO = process.env.MONGOMS_DISTRO || 'ubuntu-22.04';
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
    console.warn('MONGO_URI is not set. Using in-memory MongoDB for local development.');
  }

  const connection = await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

export default connectDB;
