import app from './app.js';
import connectDB from './config/db.js';
import { startFilesCleanup } from './modules/files/files.cleanup.js';

const PORT = Number(process.env.PORT) || 3000;

const start = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server started on port ${PORT}`);
        });

        startFilesCleanup();
        return server;
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exitCode = 1;
    }
};

start();
