import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

import { files } from "./files.model.js";

import { FilesStatus } from "./files.status.js";
import { FilesType } from './files.type.js';

import { mimeTypeToFileType } from './utils/mimeTypeToFileType.js';
import { filesTypeToCloudinaryResourceType } from './utils/filesTypeToCloudinaryResourceType.js';

import { BadRequestError, NotFoundError, TooManyRequestsError } from '../../common/errors/AppError.js';

const TRUSTED_IMAGE_HOSTS = ['googleusercontent.com'];

class FilesService {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
    }

    findById(id) {
        return files.findById(id);
    }

    findByIds(ids) {
        return files.find({ _id: { $in: ids } });
    }

    countUnattached(ownerId) {
        return files.countDocuments({
            ownerId,
            status: { $in: [FilesStatus.pending, FilesStatus.orphaned] },
        });
    }

    async findOwned(id, ownerId) {
        const file = await files.findOne({ _id: id, ownerId });
        if(!file) throw new NotFoundError('fileNotExist');
        return file;
    }

    async add(source, ownerId) {
        if (await this.countUnattached(ownerId) >= 3) {
            throw new TooManyRequestsError('tooManyUnattachedFiles');
        }

        const uploaded = typeof source === 'string'
            ? await this.uploadFromUrl(source)
            : await this.upload(source);

        try {
            const file = await files.create({
                path: uploaded.secure_url || uploaded.url,
                publicId: uploaded.public_id,
                type: uploaded.file_type,
                ownerId,
            })

            return file;
        }catch(err) {
            await this.destroy(uploaded.public_id, uploaded.file_type);
            throw err;
        }
    }

    async confirm(ids, ownerId) {
        const uniqueIds = [...new Set(ids.map(String))];

        const found = await files.find({
            _id: { $in: uniqueIds },
            ownerId,
            status: FilesStatus.pending,
            expiresAt: { $gt: new Date() },
        });

        if (found.length !== uniqueIds.length) {
            throw new BadRequestError('invalidOrExpiredFiles');
        }

        await files.updateMany(
            { _id: { $in: found.map(f => f._id) } },
            { $set: { status: FilesStatus.attached }, $unset: { expiresAt: 1 } }
        );

        return found;
    }

    async detach(ids, ownerId) {
        await files.updateMany(
            { _id: { $in: ids }, ownerId },
            {
                $set: {
                    status: FilesStatus.orphaned,
                    expiresAt: new Date(Date.now()),
                },
            }
        );
    }

    async delete(id, ownerId) {
        const file = await files.findOne({ _id: id, ownerId });

        if (!file) {
            throw new NotFoundError('fileNotExist');
        }
        if (file.status === FilesStatus.attached) {
            throw new BadRequestError('fileIsAttached');
        }

        await this.destroy(file.publicId, file.type);
        await file.deleteOne();
    }

    async cleanupExpired(limit = 100) {
        const expired = await files.find({
            status: { $in: [FilesStatus.pending, FilesStatus.orphaned] },
            expiresAt: { $lt: new Date() },
        }).limit(limit);

        let removed = 0;

        for(const file of expired) {
            try {
                await this.destroy(file.publicId, file.type);
                await file.deleteOne();
                removed++;
            } catch (err) {
                console.error('Files cleanup failed:', file._id, err.message);
            }
        }
        
        return removed;
    }

    async upload(fileMulter) {
        if(!fileMulter) {
            throw new BadRequestError('selectFile');
        }

        const type = mimeTypeToFileType(fileMulter.mimetype);

        const uploadedFile = await new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: type === FilesType.video ? 'wood-plywood/videos' : 'wood-plywood/images',
                    resource_type: filesTypeToCloudinaryResourceType(type),
                },
                (error, result) => {
                    if(error) return reject(error);
                    if(!result) {
                        return reject(new Error('Cloudinary API returned an empty result without an error message'))
                    }
                    resolve(result);
                }
            )
            Readable.from(fileMulter.buffer).pipe(upload);
        })

        uploadedFile.file_type = type;
        return uploadedFile;
    }

    async uploadFromUrl(url) {
        if(!url) {
            throw new BadRequestError('selectFile');
        }

        let parsed;
        try {
            parsed = new URL(url);
        } catch {
            throw new BadRequestError('invalidImageUrl');
        }

        const trusted = TRUSTED_IMAGE_HOSTS.some(
            (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
        );
        if (parsed.protocol !== 'https:' || !trusted) {
            throw new BadRequestError('untrustedImageUrl');
        }

        const uploadedFile = await cloudinary.uploader.upload(parsed.href, {
            folder: 'wood-plywood/images',
            resource_type: 'image',
        });

        uploadedFile.file_type = FilesType.image;
        return uploadedFile;
    }

    async destroy(publicId, type) {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: filesTypeToCloudinaryResourceType(type)
        });
    }
}

export const filesService = new FilesService();