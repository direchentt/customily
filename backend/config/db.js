import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
    try {
        await mongoose.connect(ENV.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('🟢 Conectado a MongoDB Atlas');
    } catch (err) {
        console.error('🔴 Error conectando a MongoDB:', err);
        process.exit(1);
    }
};
