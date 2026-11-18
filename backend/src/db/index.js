import mongoose from 'mongoose';
import dns from 'dns';
import { logger } from '../logger/index.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // fallback
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });

    logger.info(`MongoDB Connected - Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
  } catch (error) {
    logger.error(`MongoDB Connection Failed: ${error.message}`);
    logger.error(
      `Tip: If using MongoDB Atlas, check if cluster is active/resumed, or update MONGO_URI in backend/.env`
    );
    process.exit(1);
  }
};
