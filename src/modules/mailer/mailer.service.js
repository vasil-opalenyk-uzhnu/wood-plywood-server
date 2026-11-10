import nodemailer from "nodemailer";

import { render } from './mailer.render.js';

// 10 -> "10 minutes", 60 -> "1 hour", 1440 -> "24 hours"
const formatTtl = (minutes) => {
    if (minutes >= 60 && minutes % 60 === 0) {
        const hours = minutes / 60;
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};

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

    sendActionLink(to, { subject, title, preheader, footer, intro, buttonLabel, note, link, ttlMinutes }) {
        const ttl = formatTtl(ttlMinutes);
    
         return this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html: render('action-link', { title, preheader, footer, intro, buttonLabel, note, link, ttl }),
            text: `${intro}\n${link}\n\nThe link is valid for ${ttl}.${note ? `\n${note}` : ''}`,
        });
    }
    
    sendVerificationLink(to, link, ttlMinutes) {
        return this.sendActionLink(to, {
            subject: 'Verify your email',
            title: 'Email verification',
            preheader: 'Confirm your email to finish registration',
            footer: "If you didn't sign up, you can safely ignore this email.",
            intro: 'Thank you for registering. Click the button below to confirm your email:',
            buttonLabel: 'Confirm email',
            link,
            ttlMinutes,
        });
    }
    
    sendResetPasswordLink(to, link, ttlMinutes) {
         return this.sendActionLink(to, {
            subject: 'Reset your password',
            title: 'Password reset',
            preheader: 'Use this link to choose a new password',
            footer: 'You received this email because a password reset was requested for this address.',
            intro: 'We received a request to reset your password. Click the button below to choose a new one:',
            buttonLabel: 'Reset password',
            note: "If you didn't request this, you can safely ignore this email: your password will not change.",
            link,
            ttlMinutes,
        });
    }
}

export const mailerService = new MailerService();