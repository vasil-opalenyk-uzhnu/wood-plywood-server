import nodemailer from "nodemailer";

import { render } from './mailer.render.js';

class MailerService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        })
    }

    async verifyConnection() {
        await this.transporter.verify();
        console.log('Mailer ready');
    }

    sendVerificationCode(to, code) {
        return this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject: 'Verify your email',
            html: render('verify-email', {
                title: 'Email verification',
                preheader: `Your verification code: ${code}`,
                footer: "If you didn't sign up, you can safely ignore this email.",
                code,
            }),
            text: `Your verification code: ${code}`,
        });
    }

    sendPasswordResetCode(to, code, ttlMinutes = 15) {
        return this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject: 'Reset your password',
            html: render('reset-password', {
                title: 'Password reset',
                preheader: `Your password reset code: ${code}`,
                footer: 'You received this email because a password reset was requested for this address.',
                code,
                ttlMinutes,
            }),
            text: `Your password reset code: ${code}\nThe code is valid for ${ttlMinutes} minutes. Do not share it with anyone.\nIf you did not request a reset, ignore this email.`,
        });
    }
}

export const mailerService = new MailerService();