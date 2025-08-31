import { CONFIG } from './config.js';

export class UIManager {
    constructor() {
        // Get all elements
        this.elements = {
            botToken: document.getElementById('botToken'),
            botList: document.getElementById('botList'),
            chatMessages: document.getElementById('chatMessages'),
            messageText: document.getElementById('messageText'),
            mediaFile: document.getElementById('mediaFile'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            selectedFileName: document.getElementById('selectedFileName'),
            clearMediaFileBtn: document.getElementById('clearMediaFileBtn'),
            chatHeader: document.getElementById('chatHeader'),
            sendArea: document.getElementById('sendArea'),
            status: document.getElementById('status'),
            selectedBotName: document.getElementById('selectedBotName'),
            addBotLoader: document.getElementById('addBotLoader'),
            addBotText: document.getElementById('addBotText'),
            sendLoader: document.getElementById('sendLoader'),
            sendText: document.getElementById('sendText')
        };

        // Initialize file selection
        this._initFileUpload();
    }

    _initFileUpload() {
        const { mediaFile } = this.elements;
        if (!mediaFile) return;
        
        // File selection change handler
        mediaFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.updateMediaFileDisplay(file);
        });
        
        // Add click handler to the document to clear file when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== mediaFile) {
                // Update display without clearing the file
                if (mediaFile.files.length > 0) {
                    this.updateMediaFileDisplay(mediaFile.files[0]);
                }
            }
        });
    }

    // Bot List Management
    updateBotList(bots, selectedBotId) {
        const botList = this.elements.botList;
        
        if (!bots.length) {
            botList.innerHTML = `
                <div class="empty-state">
                    <h4>Henüz bot eklenmemiş</h4>
                    <p>Yukarıdan bot token'ı ekleyerek başlayın</p>
                </div>
            `;
            return;
        }

        botList.innerHTML = bots.map(bot => `
            <div class="bot-item ${selectedBotId === bot.id ? 'active' : ''}" 
                 data-bot-id="${bot.id}">
                <div class="bot-name">${bot.name}</div>
                <div class="bot-username">@${bot.username}</div>
                <button class="btn btn-danger remove-bot" 
                        data-bot-id="${bot.id}"
                        style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">
                    🗑️ Sil
                </button>
            </div>
        `).join('');
    }

    // Message Display
    displayMessages(messages) {
        const chatMessages = this.elements.chatMessages;
        chatMessages.innerHTML = '';

        if (!messages || !messages.length) {
            chatMessages.innerHTML = `
                <div class="empty-state">
                    <h4>Henüz mesaj yok</h4>
                    <p>Bu sohbette henüz mesaj bulunmuyor.</p>
                </div>
            `;
            return;
        }

        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${msg.senderName} (@${msg.senderUsername})</span>
                    <span class="message-time">${msg.time}</span>
                </div>
                <div class="message-text">${msg.content}</div>
            `;
            chatMessages.appendChild(messageDiv);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Status Messages
    showStatus(message, type = 'info') {
        const status = this.elements.status;
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, CONFIG.UI.MESSAGE_DISPLAY_DURATION);
    }

    // Loading States
    setLoading(element, loading) {
        const loader = this.elements[`${element}Loader`];
        const text = this.elements[`${element}Text`];
        
        if (loader && text) {
            loader.style.display = loading ? 'inline-block' : 'none';
            text.style.display = loading ? 'none' : 'inline';
        }
    }

    // Media File Handling
    updateMediaFileDisplay(file) {
        const { selectedFileName, mediaFile } = this.elements;
        
        if (!selectedFileName || !mediaFile) return;
        
        if (file) {
            console.log('Displaying file:', file.name);
            selectedFileName.textContent = `Seçili dosya: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            selectedFileName.title = file.name;
            selectedFileName.style.color = '#28a745';
        } else {
            console.log('No file selected');
            mediaFile.value = '';
            selectedFileName.textContent = 'Dosya seçilmedi';
            selectedFileName.title = '';
            selectedFileName.style.color = '#555';
        }
    }

    // Chat Area Visibility
    setChatAreaVisible(visible) {
        this.elements.chatHeader.style.display = visible ? 'flex' : 'none';
        this.elements.sendArea.style.display = visible ? 'flex' : 'none';
        
        if (!visible) {
            this.elements.chatMessages.innerHTML = `
                <div class="empty-state">
                    <h4>Bot seçin</h4>
                    <p>Sol taraftan bir bot seçerek mesajlaşmaya başlayın</p>
                </div>
            `;
        }
    }

    // Form Helpers
    clearMessageInput() {
        this.elements.messageText.value = '';
    }

    clearBotTokenInput() {
        this.elements.botToken.value = '';
    }

    // Getters
    getBotToken() {
        return this.elements.botToken.value.trim();
    }

    getMessageText() {
        return this.elements.messageText.value.trim();
    }

    getSelectedFile() {
        const fileInput = this.elements.mediaFile;
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            console.log('No file selected');
            return null;
        }
        
        const file = fileInput.files[0];
        
        // Check file size (max 20MB as per Telegram API limits)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            this.showStatus(`Dosya çok büyük! Maksimum dosya boyutu: 20MB`, 'error');
            return null;
        }
        
        console.log('Selected file:', file.name, 'Type:', file.type, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        return file;
    }
}
