import bcrypt from 'bcrypt';

import { UsersRoles } from './users.roles.js';
import { UsersStatus } from './users.status.js';
import { users } from './users.model.js';

import { AuthProviders } from '../auth/auth.providers.js';
import { filesService } from '../files/files.service.js';

import { ConflictError, NotFoundError } from '../../common/errors/AppError.js';
import { FilesStatus } from '../files/files.status.js';

class UsersService {
    findById(id) {
        return users.findById(id);
    }

    findByIds(ids) {
        return users.find({ _id: { $in: ids } });
    }

    findByEmail(email) {
        return users.findOne({ email });
    }

    findBySocialIdAndProvider(socialId, provider) {
        return users.findOne({ socialId, provider });
    }    

    async create(createUserDto) {
        let password = undefined;

        if(createUserDto.password) {
            const salt = await bcrypt.genSalt();
            password = await bcrypt.hash(createUserDto.password, salt);
        }

        let activationCode = undefined;

        if(createUserDto.activationCode) {
            const salt = await bcrypt.genSalt();
            activationCode = await bcrypt.hash(createUserDto.activationCode, salt);
        }

        let email = undefined;

        if(createUserDto.email) {
            const userByEmail = await users.findOne({ email: createUserDto.email });
            if(userByEmail) {
                throw new ConflictError('emailAlreadyExists');
            }
            email = createUserDto.email;
        }

        let role = undefined;

        if(createUserDto.role) {
            const roleObject = Object.values(UsersRoles).includes(String(createUserDto.role));
            if(!roleObject) {
                throw new NotFoundError('roleNotExist');
            }
            role = createUserDto.role;
        }

        let status = undefined;

        if(createUserDto.status) {
            const statusObject = Object.values(UsersStatus).includes(String(createUserDto.status));
            if(!statusObject) {
                throw new NotFoundError('statusNotExist');
            }
            status = createUserDto.status;
        }

        return users.create({
            email,
            password,
            role,
            status,
            activationCode,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            provider: createUserDto.provider ?? AuthProviders.email,
            socialId: createUserDto.socialId,
        })
    }

    async update(id, updateUserDto) {
        const userObject = await users.findById(id);

        if(!userObject) {
            throw new NotFoundError('userNotExist');
        }

        let password = undefined;

        if(updateUserDto.password && userObject?.password !== updateUserDto.password) {
            const salt = await bcrypt.genSalt();
            password = await bcrypt.hash(updateUserDto.password, salt);
        }

        let activationCode = undefined;

        if (updateUserDto.activationCode) {
            const salt = await bcrypt.genSalt();
            activationCode = await bcrypt.hash(updateUserDto.activationCode, salt);
        }

        let email = undefined;

        if(updateUserDto.email) {
            const existingEmail = await users.findOne({ email: updateUserDto.email, _id: { $ne: id } });
            if(existingEmail) {
                throw new ConflictError('emailAlreadyExist');
            }
            email = updateUserDto.email;
        }else if(updateUserDto.email === null) {
            email = null;
        }

        let profilePicture = undefined;

        if(updateUserDto.profilePicture) {
            const file = await filesService.findById(updateUserDto.profilePicture);
            
            if(!file) {
                throw new NotFoundError('imageNotExist');
            }

            await filesService.confirm([file._id], id);
            await filesService.detach([userObject.profilePicture], id);

            profilePicture = file.id;
        }else if(updateUserDto.profilePicture === null) {
            profilePicture = null;
        }

        let role = undefined;

        if(updateUserDto.role) {
            const roleObject = Object.values(UsersRoles).includes(String(updateUserDto.role));
            if(!roleObject) {
                throw new NotFoundError('roleNotExist');
            }
            role = updateUserDto.role;
        }

        let status = undefined;

        if(updateUserDto.status) {
            const statusObject = Object.values(UsersStatus).includes(String(updateUserDto.status));
            if(!statusObject) {
                throw new NotFoundError('statusNotExist');
            }
            status = updateUserDto.status;
        }

        return users.findByIdAndUpdate(id, {
            email,
            password,
            role,
            status,
            profilePicture,
            activationCode,
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
            provider: updateUserDto.provider,
            socialId: updateUserDto.socialId,
        })
    }
}

export const usersService = new UsersService();