import bcryp from 'bcrypt';

import { AuthProviders } from "./auth.providers.js";

import { usersService } from "../users/users.service.js";
import { UsersRoles } from "../users/users.roles.js";
import { UsersStatus } from "../users/users.status.js";
import { mailerService } from "../mailer/mailer.service.js";
import { sessionsService } from "../sessions/sessions.service.js";

import { generateActivationCode } from "../../common/utils/generateActivationCode.js";
import { NotFoundError, UnauthorizedError } from "../../common/errors/AppError.js";
import { filesService } from '../files/files.service.js';

class AuthService {
    async validatelogin(loginDto, deviceMeta) {
        const user = await usersService.findByEmail(loginDto.email);

        if(!user) {
            throw new UnauthorizedError('invalidCredentials')
        }

        if(user.provider !== AuthProviders.email) {
            throw new UnauthorizedError(`needLoginViaProvider:${user.provider}`);
        }
        
        if(!user.password) {
            throw new UnauthorizedError('invalidCredentials');
        }

        const isValidPassword = await bcryp.compare(
            loginDto.password,
            user.password
        )

        if(!isValidPassword) {
            throw new UnauthorizedError('invalidCredentials');
        }

        return sessionsService.add(user, deviceMeta);
    }

    async validateSocialLogin(authProvider, socialData, deviceMeta) {
        let user = null;
        let socialEmail = socialData.email?.toLowerCase();
        let userByEmail = null;

        if(socialEmail && !socialData.emailVerified) {
            throw new UnauthorizedError('emailNotVerified');
        }

        if(socialEmail) {
            userByEmail = await usersService.findByEmail(socialEmail);
        }

        if(socialData.id) {
            user = await usersService.findBySocialIdAndProvider(
                socialData.id, 
                authProvider
            );
        }

        if (user) {
            if (socialEmail && !userByEmail) {
                user = await usersService.update(user.id, { email: socialEmail });
            }
        } else if (userByEmail) {
            user = userByEmail;

            if (user.status === UsersStatus.inactive) {
                user = await usersService.update(user.id, {
                    provider: authProvider,
                    socialId: socialData.id,
                    status: UsersStatus.active,
                    activationCode: null,
                });
            }
        }else if(socialData.id) {
            user = await usersService.create({
                email: socialEmail ?? null,
                firstName: socialData.firstName ?? null,
                lastName: socialData.lastName ?? null,
                socialId: socialData.id,
                provider: authProvider,
                role: UsersRoles.user,
                status: UsersStatus.active
            });

            if (socialData.picture) {
                const profilePicture = await filesService.add(socialData.picture, user.id);
                user = await usersService.update(user.id, { profilePicture: profilePicture.id });
            }
        }

        if(!user) {
            throw new NotFoundError('userNotFound');
        }

        return sessionsService.add(user, deviceMeta);
    }

    async register(registerDto, deviceMeta) {
        const activationCode = generateActivationCode();
        const user = await usersService.create({
            ...registerDto,
            role: UsersRoles.user,
            status: UsersStatus.inactive,
            activationCode: activationCode
        });

        mailerService.sendVerificationCode(registerDto.email, activationCode)
            .catch((error) => console.error('Verification mail failed:', error.message));
        return sessionsService.add(user, deviceMeta);
    }

    async confirmEmail(code, userId) {
        const user = await usersService.findById(userId);

        if (!user || user.status !== UsersStatus.inactive) {
            throw new NotFoundError('notFound');
        }
        const isCodeValid = await bcryp.compare(code, user.activationCode);
        if (!isCodeValid) {
            throw new UnauthorizedError('incorrectCode');
        }

        user.status = UsersStatus.active;
        await user.save();
    }

    async me(sub) {
        const user = await usersService.findById(sub);
        const file = await filesService.findById(user.profilePicture);
        user.profilePicture = file;
        return user;
    }

    async refresh(refreshToken, deviceMeta) {
        return await sessionsService.update(refreshToken, deviceMeta);
    }

    async logout(refreshToken) {
        await sessionsService.removeByRefresh(refreshToken);
    }
}

export const authService = new AuthService();