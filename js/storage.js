import { CONFIG } from './config.js';

export class StorageManager {
    static loadBots() {
        const storedBots = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.BOTS);
        try {
            return storedBots ? JSON.parse(storedBots) : [];
        } catch (e) {
            console.error("Error parsing stored bots:", e);
            return [];
        }
    }

    static saveBots(bots) {
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.BOTS, JSON.stringify(bots));
    }

    static loadMessages(botId) {
        const storedMessages = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.MESSAGES);
        if (!storedMessages) return null;
        
        try {
            const messages = JSON.parse(storedMessages);
            return messages[botId] || null;
        } catch (e) {
            console.error("Error parsing stored messages:", e);
            return null;
        }
    }

    static saveMessages(botId, messages) {
        const storedMessages = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.MESSAGES) || '{}');
        storedMessages[botId] = messages;
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(storedMessages));
    }

    static clearBotMessages(botId) {
        const storedMessages = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEYS.MESSAGES) || '{}');
        delete storedMessages[botId];
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEYS.MESSAGES, JSON.stringify(storedMessages));
    }
}
