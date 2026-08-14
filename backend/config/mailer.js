import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Single shared transporter — imported by all mail modules
// eslint-disable-next-line sonarjs/no-clear-text-protocols -- Gmail service uses TLS (port 465) internally
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
});

export default transporter;