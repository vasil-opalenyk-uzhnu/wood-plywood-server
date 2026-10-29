import mongoose from "mongoose";

if(!process.env.MONGO_DB_URL) {
    throw new Error('Mongo url is not defined in env');
}

const connectDB = async () => {
    try{
        const db = await mongoose.connect(process.env.MONGO_DB_URL);
        console.log(`MongoDB connected, connection host: ${db.connection.host}`);
    }catch(e) {
        console.error(e);
    }
}

export default connectDB;