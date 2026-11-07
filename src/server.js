import app from './app.js';
import connectDB from './config/db.js';
import { startFilesCleanup } from './modules/files/files.cleanup.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.argv.includes('--host') ? '0.0.0.0' : 'localhost';

const start = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, HOST, () => {
            console.log(`Server running on http://${HOST}:3000`);
        });

        startFilesCleanup();
        return server;
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exitCode = 1;
    }
};

start();
