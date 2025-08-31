import { StorageManager } from './storage.js';
import { TelegramAPI } from './telegram.js';
import { UIManager } from './ui.js';
import { CONFIG } from './config.js';

class TelegramBotManager {
    constructor() {
        this.ui = new UIManager();
        this.storage = StorageManager;
        this.bots = [];
        this.selectedBot = null;
        this.telegramAPI = null;
        this.lastUpdateId = {};
        this.autoRefreshInterval = null;

        this.initialize();
    }

    initialize() {
        this.loadBots();
        this.setupEventListeners();
    }

    // Bot Management
    async addBot() {
        const token = this.ui.getBotToken();
        if (!token) {
            this.ui.showStatus('Lütfen bot token\'ını girin', 'error');
            return;
        }

        this.ui.setLoading('addBot', true);
        this.telegramAPI = new TelegramAPI(token);

        try {
            const botInfo = await this.telegramAPI.getMe();
            
            if (botInfo.ok) {
                const bot = {
                    token: token,
                    id: botInfo.result.id,
                    name: botInfo.result.first_name,
                    username: botInfo.result.username
                };

                if (this.bots.some(b => b.id === bot.id)) {
                    this.ui.showStatus('Bu bot zaten eklenmiş', 'error');
                    return;
                }

                this.bots.push(bot);
                this.lastUpdateId[bot.id] = 0;
                this.storage.saveBots(this.bots);
                this.updateBotList();
                this.ui.clearBotTokenInput();
                this.ui.showStatus(`${bot.name} (@${bot.username}) başarıyla eklendi`, 'success');
            } else {
                this.ui.showStatus('Geçersiz bot token\'ı: ' + (botInfo.description || 'Bilinmeyen Hata'), 'error');
            }
        } catch (error) {
            this.ui.showStatus('Bot eklenirken hata oluştu: ' + error.message, 'error');
        } finally {
            this.ui.setLoading('addBot', false);
        }
    }

    removeBot(botId, event) {
        event.stopPropagation();
        if (!confirm('Bu botu silmek istediğinizden emin misiniz?')) return;

        this.bots = this.bots.filter(bot => bot.id !== parseInt(botId));
        this.storage.saveBots(this.bots);
        this.storage.clearBotMessages(parseInt(botId));
        delete this.lastUpdateId[parseInt(botId)];

        if (this.selectedBot?.id === parseInt(botId)) {
            this.selectedBot = null;
            this.telegramAPI = null;
            this.ui.setChatAreaVisible(false);
        }

        this.updateBotList();
        this.ui.showStatus('Bot silindi', 'success');
    }

    selectBot(botId) {
        this.selectedBot = this.bots.find(bot => bot.id === parseInt(botId));
        if (this.selectedBot) {
            this.telegramAPI = new TelegramAPI(this.selectedBot.token);
            this.ui.elements.selectedBotName.textContent = this.selectedBot.name;
            this.ui.setChatAreaVisible(true);
            this.updateBotList();
            
            if (!this.lastUpdateId[this.selectedBot.id]) {
                this.lastUpdateId[this.selectedBot.id] = 0;
            }
            
            this.refreshMessages();
        }
    }

    // Message Management
    async refreshMessages() {
        if (!this.selectedBot) return;

        const chatMessages = this.ui.elements.chatMessages;
        const isFirstLoad = this.lastUpdateId[this.selectedBot.id] === 0;
        
        if (isFirstLoad) {
            chatMessages.innerHTML = `
                <div class="empty-state">
                    <h4>Yeni mesajlar kontrol ediliyor...</h4>
                    <span class="loading" style="display: inline-block; margin-top: 10px;"></span>
                </div>
            `;
        }

        try {
            const updates = await this.telegramAPI.getUpdates(this.lastUpdateId[this.selectedBot.id]);
            
            if (updates.ok && updates.result.length > 0) {
                if (isFirstLoad) chatMessages.innerHTML = '';
                
                const messages = await this.processUpdates(updates.result);
                this.ui.displayMessages(messages);
                
                const maxUpdateId = Math.max(...updates.result.map(update => update.update_id));
                this.lastUpdateId[this.selectedBot.id] = Math.max(
                    this.lastUpdateId[this.selectedBot.id] || 0, 
                    maxUpdateId
                );
                
                this.ui.showStatus(`${updates.result.length} yeni güncelleme alındı`, 'success');
            } else if (isFirstLoad) {
                this.showNoMessagesView();
            } else {
                this.ui.showStatus('Yeni mesaj bulunmuyor', 'info');
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
            this.ui.showStatus('Mesajlar yüklenirken hata oluştu: ' + error.message, 'error');
            if (isFirstLoad) this.showErrorView();
        }
    }

    async processUpdates(updates) {
        const messages = [];
        
        for (const update of updates) {
            if (update.message) {
                const message = update.message;
                const date = new Date(message.date * 1000);
                let content = '';
                
                if (message.text) {
                    content = message.text;
                } else if (message.photo) {
                    const fileId = message.photo[message.photo.length - 1].file_id;
                    const fileUrl = await this.telegramAPI.getFileUrl(fileId);
                    content = fileUrl 
                        ? `<img src="${fileUrl}" alt="Fotoğraf" style="max-width:100%; height:auto; border-radius: 8px;">`
                        : `Fotoğraf yüklenemedi. File ID: ${fileId}`;
                    if (message.caption) content += `<p>${message.caption}</p>`;
                } else if (message.video) {
                    const fileUrl = await this.telegramAPI.getFileUrl(message.video.file_id);
                    content = fileUrl
                        ? `<video controls src="${fileUrl}" style="max-width:100%; height:auto; border-radius: 8px;"></video>`
                        : `Video yüklenemedi. File ID: ${message.video.file_id}`;
                    if (message.caption) content += `<p>${message.caption}</p>`;
                } else if (message.audio) {
                    const fileUrl = await this.telegramAPI.getFileUrl(message.audio.file_id);
                    content = fileUrl
                        ? `<audio controls src="${fileUrl}" style="width:100%;"></audio>`
                        : `Ses dosyası yüklenemedi. File ID: ${message.audio.file_id}`;
                    if (message.caption) content += `<p>${message.caption}</p>`;
                } else if (message.document) {
                    const fileUrl = await this.telegramAPI.getFileUrl(message.document.file_id);
                    content = fileUrl
                        ? `<a href="${fileUrl}" target="_blank" style="display: flex; align-items: center; gap: 8px; text-decoration: none; color: #667eea;">
                              <span style="font-size: 1.5em;">📄</span>${message.document.file_name}
                          </a>`
                        : `Belge yüklenemedi. File ID: ${message.document.file_id}`;
                    if (message.caption) content += `<p>${message.caption}</p>`;
                }

                messages.push({
                    senderName: message.from.first_name,
                    senderUsername: message.from.username || 'N/A',
                    time: date.toLocaleString('tr-TR'),
                    content: content
                });
            }
        }
        
        return messages;
    }

    async sendMessage() {
        if (!this.selectedBot) return;

        const messageText = this.ui.getMessageText();
        const mediaFile = this.ui.getSelectedFile();
        
        if (!messageText && !mediaFile) {
            this.ui.showStatus('Lütfen mesaj yazın veya bir dosya seçin', 'error');
            return;
        }

        this.ui.setLoading('send', true);

        try {
            const chatId = await this.findChatId();
            if (!chatId) {
                this.ui.showStatus('Chat ID bulunamadı. Lütfen önce bota Telegram üzerinden bir mesaj gönderin.', 'error');
                return;
            }

            let success = false;
            
            if (mediaFile) {
                success = await this.sendMedia(chatId, mediaFile, messageText);
                if (success) {
                    this.ui.updateMediaFileDisplay(null);
                    this.ui.clearMessageInput();
                }
            } else {
                const response = await this.telegramAPI.sendMessage(chatId, messageText);
                if (response.ok) {
                    this.ui.clearMessageInput();
                    this.ui.showStatus('Mesaj gönderildi', 'success');
                    success = true;
                } else {
                    this.ui.showStatus('Mesaj gönderilemedi: ' + (response.description || 'Bilinmeyen hata'), 'error');
                }
            }

            if (success) {
                setTimeout(() => this.refreshMessages(), 1000);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.ui.showStatus('Mesaj gönderilirken hata oluştu: ' + error.message, 'error');
        } finally {
            this.ui.setLoading('send', false);
        }
    }

    async sendMedia(chatId, file, caption = '') {
        try {
            const response = await this.telegramAPI.sendMedia(chatId, file, caption);
            if (response.ok) {
                this.ui.showStatus(`Dosya (${file.name}) başarıyla gönderildi`, 'success');
                return true;
            } else {
                this.ui.showStatus(`Dosya gönderilemedi (${file.name}): ${response.description || 'Bilinmeyen hata'}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error sending media:', error);
            this.ui.showStatus(`Dosya gönderilirken hata oluştu (${file?.name}): ${error.message}`, 'error');
            return false;
        }
    }

    async findChatId() {
        if (!this.selectedBot) return null;

        try {
            const updates = await this.telegramAPI.getUpdates();
            if (updates.ok && updates.result.length > 0) {
                for (let i = updates.result.length - 1; i >= 0; i--) {
                    const update = updates.result[i];
                    if (update.message?.chat) {
                        return update.message.chat.id;
                    } else if (update.channel_post?.chat) {
                        return update.channel_post.chat.id;
                    } else if (update.callback_query?.message?.chat) {
                        return update.callback_query.message.chat.id;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error finding chat ID:', error);
            return null;
        }
    }

    // UI Helpers
    showNoMessagesView() {
        this.ui.elements.chatMessages.innerHTML = `
            <div class="empty-state">
                <h4>Henüz mesaj yok</h4>
                <p>Bu bot için henüz bekleyen güncelleme bulunmuyor.</p>
                <p><strong>Not:</strong> Telegram Bot API'si sadece botunuza gönderilen yeni mesajları çeker.</p>
                <p>Mesaj görmek için:</p>
                <ul style="text-align: left; margin-top: 10px;">
                    <li>Telegram'da bota yeni bir mesaj gönderin</li>
                    <li>Botu bir gruba ekleyip mesaj gönderin</li>
                    <li>Bot komutlarını kullanın</li>
                </ul>
            </div>
        `;
    }

    showErrorView() {
        this.ui.elements.chatMessages.innerHTML = `
            <div class="empty-state">
                <h4>Hata oluştu</h4>
                <p>Mesajlar yüklenirken bir hata oluştu.</p>
                <p>İnternet bağlantınızı kontrol edip tekrar deneyin.</p>
            </div>
        `;
    }

    // Data Management
    loadBots() {
        this.bots = this.storage.loadBots();
        this.bots.forEach(bot => {
            if (!this.lastUpdateId[bot.id]) {
                this.lastUpdateId[bot.id] = 0;
            }
        });
        this.updateBotList();
    }

    updateBotList() {
        this.ui.updateBotList(this.bots, this.selectedBot?.id);
    }

    // Event Handlers
    setupEventListeners() {
        // Bot Ekleme
        this.ui.elements.botToken.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addBot();
            }
        });

        // Bot Listesi Tıklamaları
        this.ui.elements.botList.addEventListener('click', (e) => {
            const botItem = e.target.closest('.bot-item');
            const removeButton = e.target.closest('.remove-bot');
            
            if (botItem && !removeButton) {
                const botId = botItem.dataset.botId;
                this.selectBot(botId);
            } else if (removeButton) {
                const botId = removeButton.dataset.botId;
                this.removeBot(botId, e);
            }
        });

        // Mesaj Gönderme
        this.ui.elements.messageText.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Gönder Butonu
        document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Dosya Seçme
        this.ui.elements.mediaFile.addEventListener('change', (e) => {
            this.ui.updateMediaFileDisplay(e.target.files[0]);
        });

        // Dosya Kaldırma
        this.ui.elements.clearMediaFileBtn.addEventListener('click', () => {
            this.ui.updateMediaFileDisplay(null);
        });

        // Yeni Mesajları Çek
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshMessages();
        });

        // Geçmişi Temizle
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            if (confirm('Bu botun mesaj geçmişini temizlemek istediğinizden emin misiniz?')) {
                this.storage.clearBotMessages(this.selectedBot.id);
                this.lastUpdateId[this.selectedBot.id] = 0;
                this.ui.showStatus('Mesaj geçmişi temizlendi', 'success');
                this.refreshMessages();
            }
        });

        // Otomatik Yenileme
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            if (this.selectedBot) {
                this.refreshMessages();
            }
        }, CONFIG.UI.AUTO_REFRESH_INTERVAL);
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TelegramBotManager();
});
