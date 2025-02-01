// botService.js
const TelegramBot = require('node-telegram-bot-api');
const CONFIG = require('./config');
const logger = require('./logger');

class TelegramBotService {
    constructor(token, webAppUrl) {
        this.bot = new TelegramBot(token, { polling: true });
        this.webAppUrl = webAppUrl;
        this.initializeBot();
    }

    async initializeBot() {
        try {
            // Set bot commands
            await this.bot.setMyCommands(CONFIG.BOT_COMMANDS);
            this.initializeEventHandlers();
            logger.info('Bot initialized successfully');
        } catch (error) {
            logger.error('Error initializing bot:', error);
        }
    }

    initializeEventHandlers() {
        this.bot.on('message', this.handleMessage.bind(this));
        this.bot.onText(/\/help/, this.handleHelpCommand.bind(this));
        this.bot.onText(/\/services/, this.handleServicesCommand.bind(this));
        this.bot.onText(/\/prices/, this.handlePricesCommand.bind(this));
        this.bot.onText(/\/portfolio/, this.handlePortfolioCommand.bind(this));
        this.bot.onText(/\/contact/, this.handleContactCommand.bind(this));
        this.bot.onText(/\/form/, this.handleFormCommand.bind(this));
        this.bot.onText(/\/shop/, this.handleShopCommand.bind(this));

        // Add callback query handler for inline buttons
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Handle text-based button clicks
        switch(text) {
            case '📋 Наші послуги':
                await this.handleServicesCommand(msg);
                break;
            case '💰 Прайс-лист':
                await this.handlePricesCommand(msg);
                break;
            case '📞 Зв\'язатися з нами':
                await this.handleContactCommand(msg);
                break;
        }

        if (text === '/start') {
            await this.sendStartMessage(chatId);
        }

        if (msg?.web_app_data?.data) {
            await this.handleWebAppData(msg);
        }
    }

    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        try {
            switch(data) {
                case '/services':
                    await this.handleServicesCommand({ chat: { id: chatId }});
                    break;
                case '/prices':
                    await this.handlePricesCommand({ chat: { id: chatId }});
                    break;
                case '/contact':
                    await this.handleContactCommand({ chat: { id: chatId }});
                    break;
                case '/portfolio':
                    await this.handlePortfolioCommand({ chat: { id: chatId }});
                    break;
            }
            // Answer the callback query to remove the loading state
            await this.bot.answerCallbackQuery(callbackQuery.id);
        } catch (error) {
            logger.error('Error handling callback query:', { error, chatId, data });
        }
    }


    async handleHelpCommand(msg) {
        const chatId = msg.chat.id;
        const commandsList = CONFIG.BOT_COMMANDS
            .map(cmd => `/${cmd.command} - ${cmd.description}`)
            .join('\n');

        try {
            await this.bot.sendMessage(chatId,
                `Доступні команди:\n\n${commandsList}\n\nЯкщо у вас виникли питання, звертайтесь до нашої підтримки.`
            );
        } catch (error) {
            logger.error('Error sending help message:', { error, chatId });
        }
    }

    async handleServicesCommand(msg) {
        const chatId = msg.chat.id;
        const servicesList = CONFIG.SERVICES
            .map(service => `*${service.name}*\n${service.description}\nЦіна: ${service.price}`)
            .join('\n\n');

        try {
            await this.bot.sendMessage(chatId,
                `Наші послуги:\n\n${servicesList}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            logger.error('Error sending services message:', { error, chatId });
        }
    }

    async handlePricesCommand(msg) {
        const chatId = msg.chat.id;
        const priceList = CONFIG.SERVICES
            .map(service => `${service.name}: ${service.price}`)
            .join('\n');

        try {
            await this.bot.sendMessage(chatId,
                `Прайс-лист:\n\n${priceList}\n\nДля детальної інформації звертайтесь до менеджера.`
            );
        } catch (error) {
            logger.error('Error sending prices message:', { error, chatId });
        }
    }

    async handlePortfolioCommand(msg) {
        const chatId = msg.chat.id;
        try {
            await this.bot.sendMessage(chatId,
                `Наше портфоліо доступне на сайті: ${CONFIG.HOMEPAGE_URL}/portfolio\n\nТакож ви можете переглянути наші проекти в телеграм каналі: @our_portfolio`
            );
        } catch (error) {
            logger.error('Error sending portfolio message:', { error, chatId });
        }
    }

    async handleContactCommand(msg) {
        const chatId = msg.chat.id;
        try {
            await this.bot.sendMessage(chatId,
                '📞 *Наші контакти:*\n\n' +
                '🔹 *Телефон:* +380123456789\n' +
                '🔹 *Email:* contact@example.com\n' +
                '🔹 *Telegram:* @support_manager\n' +
                '🔹 *Веб-сайт:* ' + CONFIG.HOMEPAGE_URL + '\n\n' +
                '⏰ *Графік роботи:*\n' +
                'Пн-Пт: 9:00 - 18:00\n' +
                'Сб-Нд: Вихідний\n\n' +
                '💬 Оберіть зручний спосіб зв\'язку:',
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '📞 Зателефонувати', url: 'tel:+380123456789' },
                                { text: '📧 Написати на Email', url: 'mailto:contact@example.com' }
                            ],
                            [
                                { text: '💬 Написати в Telegram', url: 'https://t.me/support_manager' }
                            ],
                            [
                                { text: '🔙 Головне меню', callback_data: '/start' }
                            ]
                        ]
                    }
                }
            );
        } catch (error) {
            logger.error('Error sending contact message:', { error, chatId });
        }
    }


    async handleFormCommand(msg) {
        const chatId = msg.chat.id;
        try {
            await this.bot.sendMessage(chatId, 'Щоб відкрити форму, будь ласка, натисніть на кнопку нижче:', {
                reply_markup: {
                    keyboard: [[
                        { text: 'Відкрити форму', web_app: { url: `${this.webAppUrl}/form` } }
                    ]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } catch (error) {
            logger.error('Error sending form message:', { error, chatId });
        }
    }

    async handleShopCommand(msg) {
        const chatId = msg.chat.id;
        try {
            await this.bot.sendMessage(chatId, 'Щоб перейти до нашого магазину, натисніть кнопку нижче:', {
                reply_markup: {
                    keyboard: [[
                        { text: 'Замовити сайт', web_app: { url: this.webAppUrl } }
                    ]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } catch (error) {
            logger.error('Error sending shop message:', { error, chatId });
        }
    }

    async sendStartMessage(chatId) {
        try {
            await this.bot.sendMessage(chatId,
                'Вітаємо! 👋\n\n' +
                'Ми допоможемо вам створити сучасний веб-сайт для вашого бізнесу. ' +
                'Використовуйте команду /help, щоб побачити всі доступні опції.\n\n' +
                'Що б ви хотіли зробити?',
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '🌐 Замовити сайт', web_app: { url: this.webAppUrl } },
                                { text: '📝 Залишити заявку', web_app: { url: `${this.webAppUrl}/form` } }
                            ],
                            [
                                { text: '📋 Наші послуги', callback_data: '/services' },
                                { text: '💰 Прайс-лист', callback_data: '/prices' }
                            ],
                            [
                                { text: '📞 Зв\'язатися з нами', callback_data: '/contact' },
                                { text: '🎯 Портфоліо', callback_data: '/portfolio' }
                            ]
                        ]
                    }
                }
            );
        } catch (error) {
            logger.error('Error sending start message', {
                error,
                chatId,
                code: error.code,
                description: error.response?.body
            });
        }
    }


    async handleWebAppData(msg) {
        const chatId = msg.chat.id;
        try {
            const data = JSON.parse(msg?.web_app_data?.data);
            logger.info(`Received data from chatId ${chatId}:`, data);

            await this.sendFeedbackMessage(chatId);
            await this.sendLeadNotification(data);
            await this.sendFollowUpMessage(chatId);
        } catch (error) {
            logger.error('Error handling web app data', { error, chatId });
        }
    }

    async sendFeedbackMessage(chatId) {
        try {
            await this.bot.sendMessage(chatId,
                `Дякуємо за заявку! 🎉\n` +
                `Ми зв'яжемося з вами найближчим часом.`
            );
        } catch (error) {
            logger.error('Error sending feedback message', { error, chatId });
        }
    }

    async sendLeadNotification(data) {
        try {
            const message =
                `🔔 Нова заявка!\n\n` +
                `👤 Ім'я: ${data.name}\n` +
                `📧 Email: ${data.email}\n` +
                `📱 Телефон: ${data.number}\n` +
                `🕒 Час: ${new Date().toLocaleString('uk-UA')}`;

            await this.bot.sendMessage(CONFIG.TG_ID, message);
        } catch (error) {
            logger.error('Error sending lead notification', { error, data });
        }
    }

    async sendFollowUpMessage(chatId) {
        try {
            await this.delay(3000);
            await this.bot.sendMessage(chatId,
                `📢 Всю інформацію Ви отримаєте у цьому чаті: ${CONFIG.TG_USERNAME}\n\n` +
                `⏳ Поки наш менеджер займається обробкою Вашої заявки, ` +
                `завітайте на наш сайт! ${CONFIG.HOMEPAGE_URL}\n\n` +
                `💡 Там ви знайдете більше інформації про наші послуги та портфоліо.`
            );
        } catch (error) {
            logger.error('Error sending follow-up message', { error, chatId });
        }
    }

    async handleWebAppQuery(queryId, products, totalPrice) {
        try {
            await this.bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                title: 'Успішна купівля',
                input_message_content: {
                    message_text:
                        `🎉 Вітаємо зі зверненням!\n\n` +
                        `💰 Сума замовлення: ${totalPrice}\n` +
                        `📦 Обрані послуги:\n${products.map(item => `- ${item.title}`).join('\n')}`
                }
            });
            return true;
        } catch (error) {
            logger.error('Error handling web app query', { error, queryId, products, totalPrice });
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleStartCallback(chatId) {
        await this.sendStartMessage(chatId);
    }
}

module.exports = TelegramBotService;