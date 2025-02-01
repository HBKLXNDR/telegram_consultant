// index.js
const App = require('./app');
const logger = require('./logger');

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
});

try {
    // Create an instance of the App class
    const app = new App();
    app.start();
} catch (error) {
    logger.error('Failed to start application:', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
}