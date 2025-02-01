// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const CONFIG = require('./config');
const logger = require('./logger');
const TelegramBotService = require('./botService');

class App {
    constructor() {
        this.app = express();
        this.botService = new TelegramBotService(CONFIG.BOT_TOKEN, CONFIG.WEB_APP_URL);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandler();
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'", 'https://api.telegram.org']
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: [CONFIG.WEB_APP_URL, CONFIG.HOMEPAGE_URL],
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }));

        // Request parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use(this.logRequest.bind(this));
    }

    logRequest(req, res, next) {
        logger.info('Incoming request', {
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip
        });
        next();
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', this.handleHealthCheck.bind(this));

        // Main endpoints
        this.app.get('/', this.handleRoot.bind(this));
        this.app.post('/web-data', this.handleWebData.bind(this));

        // Catch 404
        this.app.use(this.handle404.bind(this));
    }

    setupErrorHandler() {
        this.app.use((err, req, res, next) => {
            logger.error('Unhandled error', {
                error: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method
            });

            res.status(500).json({
                status: 'error',
                message: process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : err.message
            });
        });
    }

    handleHealthCheck(req, res) {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }

    handleRoot(req, res) {
        res.status(200).json({
            message: 'Welcome to the Telegram Bot API!',
            version: '1.0.0',
            documentation: '/docs',
            homepage: CONFIG.HOMEPAGE_URL,
            webAppUrl: CONFIG.WEB_APP_URL
        });
    }

    async handleWebData(req, res) {
        const { products, totalPrice, queryId } = req.body;
        logger.info('Received web-data request:', { products, totalPrice, queryId });

        try {
            if (!this.validateWebData(products, totalPrice, queryId)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields'
                });
            }

            await this.botService.handleWebAppQuery(queryId, products, totalPrice);
            return res.status(200).json({
                status: 'success',
                message: 'Web data processed successfully'
            });
        } catch (error) {
            logger.error('Error processing web-data', {
                error: error.message,
                stack: error.stack,
                body: req.body
            });
            return res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    validateWebData(products, totalPrice, queryId) {
        if (!queryId || !products || !totalPrice) {
            return false;
        }
        if (!Array.isArray(products) || products.length === 0) {
            return false;
        }
        if (typeof totalPrice !== 'number' || totalPrice <= 0) {
            return false;
        }
        return true;
    }

    handle404(req, res) {
        logger.warn('404 Not Found', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });
        res.status(404).json({
            status: 'error',
            message: 'Resource not found'
        });
    }

    start() {
        this.app.listen(CONFIG.PORT, () => {
            console.log(`Server started on PORT ${CONFIG.PORT}`);
            logger.info(`Server started on PORT ${CONFIG.PORT}`, {
                port: CONFIG.PORT,
                environment: process.env.NODE_ENV
            });
        });
    }
}

module.exports = App;