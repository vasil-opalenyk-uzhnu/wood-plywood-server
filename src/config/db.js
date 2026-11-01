import mongoose from 'mongoose';

const connectDB = async () => {
    if (!process.env.MONGO_DB_URL) {
        throw new Error('Mongo url is not defined in env');
    }

    const db = await mongoose.connect(process.env.MONGO_DB_URL);
    console.log(`MongoDB connected, connection host: ${db.connection.host}`);
    return db;
};

export default connectDB;
