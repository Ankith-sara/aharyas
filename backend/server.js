import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import logger from './config/logger.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Config constants 
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; 
const API_RATE_LIMIT_MAX = 500;       
const CORS_PREFLIGHT_MAX_AGE = 86400;
const IS_DEV = process.env.NODE_ENV !== 'production';

const skipInDev = (_req) => IS_DEV;

import parseCookies from './middlewares/cookies.js';
import connectDB from './config/mongodb.js';
import userRouter from './routes/UserRoute.js';
import productRouter from './routes/ProductRoute.js';
import cartRouter from './routes/CartRoute.js';
import orderRouter from './routes/OrderRoute.js';
import wishlistRouter from './routes/WishlistRoute.js';
import chatRouter from './routes/ChatRoute.js';
import sitemapRouter from './routes/SitemapRoute.js';
import { initAnalyticsSocket } from './config/socket.js';

// App Config
const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4001;

const CRITICAL_ENV_VARS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'IMAGEKIT_PUBLIC_KEY',
    'IMAGEKIT_PRIVATE_KEY',
    'IMAGEKIT_URL_ENDPOINT',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_SECRET_KEY'
];

const validateEnv = () => {
    if (process.env.NODE_ENV === 'test') return;
    const missing = CRITICAL_ENV_VARS.filter(key => !process.env[key]);
    if (missing.length > 0) {
        logger.error(`FATAL: Missing critical environment variables: ${missing.join(', ')}`);
        console.error(`FATAL: Missing critical environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
};

validateEnv();
connectDB();

// Allowed Origins
const allowedOrigins = [
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 
    'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000', 
    'http://localhost:3001', 'http://localhost:3002',
    'https://admin.aharyas.com', 'https://www.admin.aharyas.com', 
    'https://aharyas.com', 'https://www.aharyas.com',
];

export const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true }
});

// Initialize Socket.IO analytics (replaces old socket handler)
initAnalyticsSocket(io);

// CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked origin: ${origin}`);
            callback(new Error(`CORS policy: Origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'token'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: CORS_PREFLIGHT_MAX_AGE,
}));

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

app.use(helmet());

// Global API rate limiter (Redis-backed per-endpoint limiters are on routes)
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: API_RATE_LIMIT_MAX,
    skip: skipInDev,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use('/api/v1/', apiLimiter);

// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(parseCookies); // lightweight httpOnly cookie reader (no external dep)

app.use(morgan('combined'));

app.get('/health', (req, res) => {
    const isInternal = req.headers['x-health-key'] === process.env.HEALTH_SECRET;
    res.json(isInternal
        ? { status: 'ok', uptime: process.uptime(), timestamp: Date.now(), version: 'v1' }
        : { status: 'ok' }
    );
});

app.use('/api/v1/user', userRouter);
app.use('/api/v1/product', productRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1', sitemapRouter); 
app.use('/', sitemapRouter); 

app.get('/', (req, res) => {
    res.send("Aharyas API is running ");
});

app.use((req, res, _next) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    logger.error(`Unhandled error: ${err.stack || err.message}`, err);
    res.status(status).json({
        success: false,
        message: status < 500
            ? (err.message || 'Bad request')
            : 'An internal server error occurred. Please try again later.',
    });
});

httpServer.listen(port, () => console.log(`Server started on PORT: ${port}`));

export default app;