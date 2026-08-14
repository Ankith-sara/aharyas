import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('DB connected');
    });
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: process.env.NODE_ENV === 'production' ? 50 : 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        // Retry on transient network errors
        retryWrites: true,
        retryReads: true,
    });
}

export default connectDB;
