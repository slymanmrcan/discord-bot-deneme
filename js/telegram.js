import { CONFIG } from './config.js';

export class TelegramAPI {
    constructor(token) {
        this.token = token;
        this.baseUrl = `${CONFIG.API.BASE_URL}${token}`;
        this.mediaUrlCache = new Map();
    }

    async getMe() {
        return this._makeRequest('/getMe');
    }

    async getUpdates(offset = 0) {
        const params = new URLSearchParams({
            offset: offset,
            limit: CONFIG.API.UPDATE_LIMIT,
            timeout: CONFIG.API.TIMEOUT / 1000 // Convert to seconds
        });
        return this._makeRequest(`/getUpdates?${params}`);
    }

    async sendMessage(chatId, text) {
        return this._makeRequest('/sendMessage', 'POST', {
            chat_id: chatId,
            text: text
        });
    }

    async sendMedia(chatId, file, caption = '') {
        try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            if (caption) formData.append('caption', caption);

            const { endpoint, field } = this._getMediaEndpoint(file.type);
            formData.append(field, file, file.name);

            console.log(`Sending media: ${file.name} (${file.type}) as ${field}`);
            const result = await this._makeRequest(`/${endpoint}`, 'POST', formData);
            console.log('Media sent successfully:', result);
            return result;
        } catch (error) {
            console.error('Error in sendMedia:', error);
            throw error;
        }
    }

    async getFileUrl(fileId) {
        if (this.mediaUrlCache.has(fileId)) {
            return this.mediaUrlCache.get(fileId);
        }

        try {
            const response = await this._makeRequest(`/getFile?file_id=${fileId}`);
            if (response.ok && response.result?.file_path) {
                const fileUrl = `https://api.telegram.org/file/bot${this.token}/${response.result.file_path}`;
                this.mediaUrlCache.set(fileId, fileUrl);
                return fileUrl;
            }
            return null;
        } catch (error) {
            console.error('Error getting file URL:', error);
            return null;
        }
    }

    async _makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {},
            // Important: Don't set credentials for Telegram API
            credentials: 'omit'
        };

        try {
            let response;
            
            if (data instanceof FormData) {
                // For file uploads, let the browser set the content type with boundary
                options.body = data;
                response = await fetch(url, options);
            } else if (data) {
                // For JSON data
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
                response = await fetch(url, options);
            } else {
                // For simple GET requests
                response = await fetch(url, options);
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error('Telegram API error:', result);
                throw new Error(result.description || 'Unknown error from Telegram API');
            }
            
            return result;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    _getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) return 'photo';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.startsWith('video/')) return 'video';
        return 'document';
    }

    _getMediaEndpoint(mimeType) {
        const type = this._getMediaType(mimeType);
        const endpoints = {
            photo: { endpoint: 'sendPhoto', field: 'photo' },
            audio: { endpoint: 'sendAudio', field: 'audio' },
            video: { endpoint: 'sendVideo', field: 'video' },
            document: { endpoint: 'sendDocument', field: 'document' }
        };
        return endpoints[type] || endpoints.document;
    }
}
