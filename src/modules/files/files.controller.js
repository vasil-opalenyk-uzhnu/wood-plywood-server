import { filesService } from './files.service.js';
import { toFileResponse } from '../../common/dto/fileResponse.dto.js';

class FilesController {
    async upload(req, res) {
        const ownerId = req.user.id;
        const fileMulter = req.file;

        const file = await filesService.add(fileMulter, ownerId);

        return res.status(201).json({ file: toFileResponse(file) });
    }
    async delete(req, res) {
        const { id } = req.params;
        const ownerId = req.user.id;

        await filesService.delete(id, ownerId);

        return res.json({ message: 'File deleted successfully' });
    }
}

export const filesController = new FilesController();