// config.js
require('dotenv').config();

const CONFIG = {
    REQUIRED_ENV_VARS: ['BOT_TOKEN', 'WEB_APP_URL', 'HOMEPAGE_URL', 'TG_ID'],
    PORT: process.env.PORT || 8000,
    BOT_TOKEN: process.env.BOT_TOKEN,
    WEB_APP_URL: process.env.WEB_APP_URL,
    HOMEPAGE_URL: process.env.HOMEPAGE_URL,
    TG_USERNAME: process.env.TG_USERNAME,
    TG_ID: process.env.TG_ID,
    BOT_COMMANDS: [
        { command: 'start', description: 'Почати роботу з ботом' },
        { command: 'help', description: 'Показати доступні команди' },
        { command: 'services', description: 'Наші послуги' },
        { command: 'prices', description: 'Прайс-лист' },
        { command: 'portfolio', description: 'Наше портфоліо' },
        { command: 'contact', description: 'Зв\'язатися з нами' },
        { command: 'form', description: 'Відкрити форму замовлення' },
        { command: 'shop', description: 'Відкрити магазин' }
    ],
    SERVICES: [
        {
            name: 'Розробка веб-сайтів',
            description: 'Створення сучасних та адаптивних веб-сайтів',
            price: 'від 500$'
        },
        {
            name: 'Розробка інтернет-магазинів',
            description: 'Повнофункціональні e-commerce рішення',
            price: 'від 1000$'
        },
        {
            name: 'Технічна підтримка',
            description: 'Обслуговування та оновлення веб-сайтів',
            price: 'від 100$/місяць'
        }
    ]
};

// Validate environment variables
CONFIG.REQUIRED_ENV_VARS.forEach((varName) => {
    if (!process.env[varName]) {
        throw new Error(`Environment variable ${varName} is required`);
    }
});

module.exports = CONFIG;