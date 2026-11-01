import cron from "node-cron";

import { filesService } from "./files.service.js";

let running  = false;

export const startFilesCleanup = () => {
    cron.schedule('*/5 * * * *', async () => {
        if (running) return;
        running = true;

        try {
            const count = await filesService.cleanupExpired();
            if (count) console.log(`Files cleanup: removed ${count}`);
        } catch (err) {
            console.error('Files cleanup error:', err);
        } finally {
            running = false;
        }
    });
}