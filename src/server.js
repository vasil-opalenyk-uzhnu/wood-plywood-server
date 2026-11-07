import app from './app.js';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { startFilesCleanup } from './modules/files/files.cleanup.js';
import { mailerService } from './modules/mailer/mailer.service.js';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.argv.includes('--host') ? '0.0.0.0' : 'localhost';

const start = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, HOST, () => {
            console.log(`Server running on http://${HOST}:${PORT}`);
        });

        const cleanupTask = startFilesCleanup();

        mailerService.verifyConnection()
            .catch((error) => console.error('Mailer connection failed:', error.message));

        let shuttingDown = false;
        const shutdown = (signal) => {
            if (shuttingDown) return;
            shuttingDown = true;
            console.log(`${signal} received, shutting down`);

            cleanupTask.stop();
            setTimeout(() => process.exit(1), 10_000).unref();

            server.close(async () => {
                await mongoose.disconnect();
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        return server;
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exitCode = 1;
    }
};

start();
