import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

import { files, defaultExpiresAt } from "./files.model.js";

import { FilesStatus } from "./files.status.js";
import { FilesType } from './files.type.js';

import { mimeTypeToFileType } from './utils/mimeTypeToFileType.js';
import { filesTypeToCloudinaryResourceType } from './utils/filesTypeToCloudinaryResourceType.js';

import { BadRequestError, ConflictError, NotFoundError, TooManyRequestsError } from '../../common/errors/AppError.js';

const TRUSTED_IMAGE_HOSTS = ['googleusercontent.com'];
const DELETE_LEASE_MS = 10 * 60 * 1000;
const UNATTACHED = [FilesStatus.pending, FilesStatus.orphaned];

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
            status: { $in: UNATTACHED },
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
                path: uploaded.secure_url ?? uploaded.url,
                publicId: uploaded.public_id,
                type: uploaded.file_type,
                ownerId,
            })

            return file;
        }catch(err) {
            try {
                await this.destroy(uploaded.public_id, uploaded.file_type);
            } catch (destroyErr) {
                console.error('Files rollback failed:', uploaded.public_id, destroyErr.message);
            }
            throw err;
        }
    }

    async confirm(ids, ownerId) {
        const uniqueIds = [...new Set(ids.map(String))];
        const confirmed = [];

        for (const id of uniqueIds) {
            const file = await files.findOneAndUpdate(
                {
                    _id: id,
                    ownerId,
                    status: FilesStatus.pending,
                    expiresAt: { $gt: new Date() },
                },
                { $set: { status: FilesStatus.attached }, $unset: { expiresAt: 1 } },
                { returnDocument: 'before' }
            );

            if (!file) {
                await this.release(confirmed.map(f => f._id), ownerId);
                throw new BadRequestError('invalidOrExpiredFiles');
            }

            confirmed.push(file);
        }

        return confirmed;
    }

    async release(ids, ownerId) {
        if (!ids.length) return;
    
        await files.updateMany(
            { _id: { $in: ids }, ownerId, status: FilesStatus.attached },
            { $set: { status: FilesStatus.pending, expiresAt: defaultExpiresAt() } }
        );
    }

    async detach(ids, ownerId) {
        const validIds = ids.filter(Boolean);
        if(!validIds.length) return;

        await files.updateMany(
            { _id: { $in: validIds }, ownerId, status: FilesStatus.attached },
            {
                $set: {
                    status: FilesStatus.orphaned,
                    expiresAt: new Date(Date.now()),
                },
            }
        );
    }

    async delete(id, ownerId) {
        const file = await this.claimForDeletion({
            _id: id,
            ownerId,
            status: { $in: UNATTACHED },
        });

        if (!file) {
            const existing = await files.findOne({ _id: id, ownerId });
        
            if (existing?.status === FilesStatus.attached) {
                throw new ConflictError('fileInUse');
            }
        
            throw new NotFoundError('fileNotExist');
        }

        await this.remove(file);
    }

    async cleanupExpired(limit = 100) {
        const expired = await files.find({
            status: { $in: [...UNATTACHED, FilesStatus.deleting] },
            expiresAt: { $lt: new Date() },
        }).limit(limit);

        let removed = 0;

        for(const candidate of expired) {
            try {
                const file = await this.claimForDeletion({
                    _id: candidate._id,
                    status: { $in: [...UNATTACHED, FilesStatus.deleting] },
                    expiresAt: { $lt: new Date() },
                });
                if (!file) continue;
            
                await this.remove(file);
                removed++;
            } catch (err) {
                console.error('Files cleanup failed:', candidate._id, err.message);
            }
        }
        
        return removed;
    }

    claimForDeletion(filter) {
        return files.findOneAndUpdate(
            filter,
            {
                $set: {
                    status: FilesStatus.deleting,
                    expiresAt: new Date(Date.now() + DELETE_LEASE_MS),
                },
            },
            { returnDocument: 'before' }
        );
    }
    
    async remove(file) {
        await this.destroy(file.publicId, file.type);
        await files.deleteOne({ _id: file._id, status: FilesStatus.deleting });
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
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: filesTypeToCloudinaryResourceType(type),
            invalidate: true
        });

        if (response?.result !== 'ok' && response?.result !== 'not found') {
            throw new Error(`Cloudinary destroy failed: ${response?.result}`);
        }
    }
}

export const filesService = new FilesService();