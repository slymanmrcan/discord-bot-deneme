// Configuration and constants
export const CONFIG = {
    LOCAL_STORAGE_KEYS: {
        BOTS: 'telegramBots',
        MESSAGES: 'telegramMessages'
    },
    API: {
        BASE_URL: 'https://api.telegram.org/bot',
        TIMEOUT: 2000, // 2 seconds
        UPDATE_LIMIT: 100
    },
    UI: {
        MESSAGE_DISPLAY_DURATION: 5000, // 5 seconds
        AUTO_REFRESH_INTERVAL: 10000 // 10 seconds
    }
};
