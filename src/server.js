import app from "./app.js";
import connectDB from './config/db.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
    try{
        await app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        })
        connectDB();
    }catch(e) {
        console.log(e);
    }
}

start();