import bcryp from 'bcrypt';

import { AuthProviders } from "./auth.providers.js";

import { usersService } from "../users/users.service.js";
import { UsersRoles } from "../users/users.roles.js";
import { UsersStatus } from "../users/users.status.js";
import { mailerService } from "../mailer/mailer.service.js";
import { sessionsService } from "../sessions/sessions.service.js";
import { accountTokensService } from "../account-tokens/account-tokens.service.js";
import { filesService } from '../files/files.service.js';
import { AccountTokensPurposes } from '../account-tokens/account-tokens.purposes.js';

import { BadRequestError, NotFoundError, UnauthorizedError } from "../../common/errors/AppError.js";

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

        if(user.status !== UsersStatus.active) {
            throw new UnauthorizedError('emailNotVerified')
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
                await sessionsService.removeAll(user.id);
                await accountTokensService.revokeAll(user.id);

                user = await usersService.update(user.id, {
                    provider: authProvider,
                    socialId: socialData.id,
                    status: UsersStatus.active,
                    password: null,
                    firstName: socialData.firstName ?? user.firstName,
                    lastNmae: socialData.lastName ?? user.lastName,
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
                try {
                    const profilePicture = await filesService.add(socialData.picture, user.id);
                    user = await usersService.update(user.id, { profilePicture: profilePicture.id });
                } catch (error) {
                    console.error('Social avatar import failed:', error.message);
                }
            }
        }

        if(!user) {
            throw new NotFoundError('userNotFound');
        }

        return sessionsService.add(user, deviceMeta);
    }

    async register(registerDto) {
        accountTokensService.assertConfigured(AccountTokensPurposes.verifyEmail);

        let user = await usersService.findByEmail(registerDto.email);

        if(user && user.provider === AuthProviders.email && user.status === UsersStatus.inactive) {
            user = await usersService.update(user.id, {
                password: registerDto.password,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
            });
        }else {
            user = await usersService.create({
                ...registerDto,
                role: UsersRoles.user,
                status: UsersStatus.inactive
            });
        }

        const issued = await accountTokensService.create(user._id, AccountTokensPurposes.emailVerified);
        if(!issued) return;
        
        mailerService.sendVerificationLink(registerDto.email, issued.link, issued.ttlMinutes)
            .catch((error) => console.error('Verification mail failed:', error.message));
    }

    async confirmEmail(token) {
        const userId = await accountTokensService.verify(token, AccountTokensPurposes.verifyEmail);
        const user = await usersService.findById(userId);

        if (!user || user.status !== UsersStatus.inactive) {
            throw new NotFoundError('notFound');
        }

        user.status = UsersStatus.active;
        await user.save();
    }

    async forgotPassword(email) {
        accountTokensService.assertConfigured(AccountTokensPurposes.resetPassword);

        const user = await usersService.findByEmail(email);
        if(!user || user.provider !== AuthProviders.email || user.status !== UsersStatus.active) return;

        const issued = await accountTokensService.create(user._id, AccountTokensPurposes.resetPassword);
        if(!issued) return;

        mailerService.sendResetPasswordLink(user.email, issued.link, issued.ttlMinutes)
            .catch((error) => console.error('Reset password mail failed:', error.message));
    }

    async resetPassword(token, password) {
        const userId = await accountTokensService.verify(token, AccountTokensPurposes.resetPassword);

        const user = await usersService.findById(userId);
        if(!user || user.provider !== AuthProviders.email || user.status !== UsersStatus.active) {
            throw new BadRequestError('invalidToken');
        }

        await usersService.update(user.id, { password });
        await sessionsService.removeAll(user.id);
    }

    async me(sub) {
        const user = await usersService.findById(sub).populate('profilePicture');
        if (!user) {
            throw new NotFoundError('userNotFound');
        }
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