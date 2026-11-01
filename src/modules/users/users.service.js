import bcrypt from 'bcrypt';

import { UsersRoles } from './users.roles.js';
import { UsersStatus } from './users.status.js';
import { users } from './users.model.js';

import { AuthProviders } from '../auth/auth.providers.js';
import { filesService } from '../files/files.service.js';

import { ConflictError, NotFoundError } from '../../common/errors/AppError.js';

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
        } else if (updateUserDto.activationCode === null) {
            activationCode = null;
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
        let previousProfilePicture = null;
        let newlyConfirmedFileId = null;

        if (updateUserDto.profilePicture) {
            if (String(updateUserDto.profilePicture) === String(userObject.profilePicture ?? '')) {
                profilePicture = userObject.profilePicture;
            } else {
                const file = await filesService.findOwned(updateUserDto.profilePicture, id);
                await filesService.confirm([file._id], id);

                profilePicture = file._id;
                newlyConfirmedFileId = file._id;
                previousProfilePicture = userObject.profilePicture;
            }
        } else if (updateUserDto.profilePicture === null) {
            profilePicture = null;
            previousProfilePicture = userObject.profilePicture;
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

        const update = {
            ...(email !== undefined && { email }),
            ...(password !== undefined && { password }),
            ...(role !== undefined && { role }),
            ...(status !== undefined && { status }),
            ...(profilePicture !== undefined && { profilePicture }),
            ...(activationCode !== undefined && { activationCode }),
            ...(updateUserDto.firstName !== undefined && { firstName: updateUserDto.firstName }),
            ...(updateUserDto.lastName !== undefined && { lastName: updateUserDto.lastName }),
            ...(updateUserDto.provider !== undefined && { provider: updateUserDto.provider }),
            ...(updateUserDto.socialId !== undefined && { socialId: updateUserDto.socialId }),
        };

        let updatedUser;
        try {
            updatedUser = await users.findByIdAndUpdate(id, { $set: update }, {
                new: true,
                runValidators: true,
            });
        } catch (error) {
            if (newlyConfirmedFileId) {
                await filesService.detach([newlyConfirmedFileId], id).catch(() => {});
            }
            throw error;
        }

        if (previousProfilePicture && String(previousProfilePicture) !== String(profilePicture ?? '')) {
            await filesService.detach([previousProfilePicture], id);
        }

        return updatedUser;
    }
}

export const usersService = new UsersService();