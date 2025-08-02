// Конфигурация
        const CONFIG = {
            MAX_MESSAGE_LENGTH: 1000,
            WEBHOOK_URL: "https://n8n.arrivedaliens.com/webhook/aa_chat",
            STORAGE_PREFIX: "secure_chat_",
            REQUEST_TIMEOUT: 30000
        };

        // Состояние приложения
        let isLoading = false;
        let sessionId = null;
        let lastMessageDate = null; // Для отслеживания последней даты сообщения

        // DOM элементы
        let chatBox, userInput, sendButton, charCounter;

        // Инициализация после загрузки DOM
        document.addEventListener('DOMContentLoaded', initializeChat);

        function initializeChat() {
            // Получение DOM элементов
            chatBox = document.getElementById("chat_box");
            userInput = document.getElementById("user_input");
            sendButton = document.getElementById("chat_button");
            charCounter = document.getElementById("char_counter");

            if (!chatBox || !userInput || !sendButton) {
                console.error('Required DOM elements not found');
                return;
            }

            // Инициализация сессии
            initializeSession();
            
            // Восстановление истории
            loadChatHistory();
            
            // Установка обработчиков событий
            setupEventListeners();
            
            console.log('Chat initialized successfully');
        }

        function initializeSession() {
            try {
                sessionId = localStorage.getItem(`${CONFIG.STORAGE_PREFIX}session_id`);
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    localStorage.setItem(`${CONFIG.STORAGE_PREFIX}session_id`, sessionId);
                }
            } catch (error) {
                console.error('Session initialization failed:', error);
                sessionId = Date.now().toString(); // Fallback
            }
        }

        function setupEventListeners() {
            // Автоматическое изменение высоты textarea
            userInput.addEventListener('input', () => {
                autoResizeTextarea();
                updateCharCounter();
            });

            // Отправка по Enter (без Shift)
            userInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Отправка по кнопке
            sendButton.addEventListener("click", () => {
                if (!isLoading) {
                    sendMessage();
                }
            });
            
            // Инициализация счетчика
            updateCharCounter();
        }

        function autoResizeTextarea() {
            // Сброс высоты для правильного пересчета
            userInput.style.height = 'auto';
            
            // Вычисляем нужную высоту
            const minHeight = 48;   // минимальная высота (1 строка)
            const maxHeight = 120;  // максимальная высота (5 строк)
            
            let newHeight = Math.max(minHeight, userInput.scrollHeight);
            newHeight = Math.min(newHeight, maxHeight);
            
            userInput.style.height = newHeight + 'px';
        }

        function formatTimestamp() {
            const now = new Date();
            return now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        }

        function formatDateHeader(date) {
            const now = new Date();
            
            // Всегда показываем конкретную дату
            if (date.getFullYear() === now.getFullYear()) {
                // Если год текущий, показываем только месяц и день
                return date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                });
            } else {
                // Если год другой, показываем полную дату с годом
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }

        function getDateString(date) {
            return date.toDateString(); // Возвращает строку типа "Mon Jan 01 2024"
        }

        function shouldShowDateSeparator(currentDate) {
            if (!lastMessageDate) return true;
            
            const currentDateString = getDateString(currentDate);
            const lastDateString = getDateString(lastMessageDate);
            
            return currentDateString !== lastDateString;
        }

        function renderDateSeparator(date) {
            const separator = document.createElement("div");
            separator.className = "date-separator";
            
            const dateText = document.createElement("div");
            dateText.className = "date-text";
            dateText.textContent = formatDateHeader(date);
            
            separator.appendChild(dateText);
            chatBox.appendChild(separator);
            
            return separator;
        }

        function updateCharCounter() {
            const length = userInput.value.length;
            const max = CONFIG.MAX_MESSAGE_LENGTH;
            
            charCounter.textContent = `${length}/${max}`;
            
            // Изменение цвета в зависимости от лимита
            charCounter.className = 'char-counter';
            if (length > max * 0.9) {
                charCounter.classList.add('warning');
            }
            if (length >= max) {
                charCounter.classList.add('error');
            }
        }

        function validateMessage(message) {
            if (!message || message.trim().length === 0) {
                return { valid: false, error: "Message cannot be empty" };
            }
            
            if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
                return { valid: false, error: `Message too long (max ${CONFIG.MAX_MESSAGE_LENGTH} characters)` };
            }
            
            return { valid: true };
        }

        function sanitizeMessage(message) {
            // Базовая очистка от потенциально опасных символов
            return message
                .trim()
                .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Удаляем control characters
                .substring(0, CONFIG.MAX_MESSAGE_LENGTH);
        }

        async function sendMessage() {
            if (isLoading) return;

            const rawMessage = userInput.value;
            const validation = validateMessage(rawMessage);
            
            if (!validation.valid) {
                showError(validation.error);
                return;
            }

            const message = sanitizeMessage(rawMessage);
            
            try {
                // Блокируем интерфейс
                setLoadingState(true);
                
                // Отображаем сообщение пользователя
                renderMessage("user", message);
                appendToHistory("user", message);
                userInput.value = "";
                autoResizeTextarea(); // Сброс высоты после очистки
                updateCharCounter();

                // Показываем индикатор загрузки
                const loaderElement = renderLoader();

                // Отправляем запрос
                const reply = await sendToAPI(message);
                
                // Убираем индикатор загрузки
                removeLoader(loaderElement);
                
                // Показываем ответ
                renderMessage("bot", reply);
                appendToHistory("bot", reply);
                
            } catch (error) {
                console.error('Send message error:', error);
                const errorMessage = getErrorMessage(error);
                
                // Убираем индикатор загрузки если есть
                const loader = chatBox.querySelector('.loader');
                if (loader) {
                    removeLoader(loader.closest('.message-container'));
                }
                
                renderMessage("bot", errorMessage);
                appendToHistory("bot", errorMessage);
            } finally {
                setLoadingState(false);
            }
        }

        async function sendToAPI(message) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

            try {
                const response = await fetch(CONFIG.WEBHOOK_URL, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ 
                        message: message, 
                        session_id: sessionId,
                        timestamp: new Date().toISOString()
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Обработка разных форматов ответа
                let reply;
                if (Array.isArray(data)) {
                    reply = data[0]?.reply_text || data[0]?.message || "No response";
                } else {
                    reply = data.reply_text || data.message || data.response || "No response";
                }

                if (!reply || typeof reply !== 'string') {
                    throw new Error('Invalid response format');
                }

                return sanitizeMessage(reply);
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }

        function setLoadingState(loading) {
            isLoading = loading;
            userInput.disabled = loading;
            sendButton.disabled = loading;
            
            // Изменяем иконку кнопки при загрузке
            if (loading) {
                sendButton.innerHTML = '<div style="width: 12px; height: 12px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
            } else {
                sendButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7l10 10M7 17L17 7"/></svg>';
            }
        }

        function getErrorMessage(error) {
            if (error.name === 'AbortError') {
                return "Request timed out. Please try again.";
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return "Network error. Please check your connection and try again.";
            } else if (error.message.includes('HTTP 4')) {
                return "Invalid request. Please try again.";
            } else if (error.message.includes('HTTP 5')) {
                return "Server error. Please try again later.";
            } else {
                return "An error occurred. Please try again.";
            }
        }

        function renderMessage(sender, text, messageDate = null) {
            const currentDate = messageDate || new Date();
            
            // Проверяем, нужно ли показать разделитель даты
            if (shouldShowDateSeparator(currentDate)) {
                renderDateSeparator(currentDate);
            }
            
            // Обновляем последнюю дату сообщения
            lastMessageDate = currentDate;
            
            const messageContainer = document.createElement("div");
            messageContainer.className = `message-container ${sender}`;
            
            const bubble = document.createElement("div");
            bubble.className = `bubble ${sender}`;
            
            if (sender === "user") {
                // Для пользователя: текст + время внутри пузыря
                const messageText = document.createElement("div");
                messageText.textContent = text;
                
                const timestamp = document.createElement("div");
                timestamp.className = "timestamp user";
                timestamp.textContent = formatTimestamp();
                
                bubble.appendChild(messageText);
                bubble.appendChild(timestamp);
                messageContainer.appendChild(bubble);
            } else {
                // Для бота: текст без фона + время снаружи
                bubble.textContent = text;
                
                const timestamp = document.createElement("div");
                timestamp.className = "timestamp";
                timestamp.textContent = formatTimestamp();
                
                messageContainer.appendChild(bubble);
                messageContainer.appendChild(timestamp);
            }
            
            chatBox.appendChild(messageContainer);
            scrollToBottom();
            
            return messageContainer;
        }

        function renderLoader() {
            const currentDate = new Date();
            
            // Проверяем, нужно ли показать разделитель даты
            if (shouldShowDateSeparator(currentDate)) {
                renderDateSeparator(currentDate);
            }
            
            // Обновляем последнюю дату сообщения
            lastMessageDate = currentDate;
            
            const messageContainer = document.createElement("div");
            messageContainer.className = "message-container bot";
            
            const bubble = document.createElement("div");
            bubble.className = "bubble bot loader";
            bubble.textContent = "Thinking";
            
            messageContainer.appendChild(bubble);
            chatBox.appendChild(messageContainer);
            scrollToBottom();
            
            return messageContainer;
        }

        function removeLoader(loaderElement) {
            if (loaderElement && loaderElement.parentNode) {
                loaderElement.parentNode.removeChild(loaderElement);
            }
        }

        function showError(message) {
            const errorDiv = document.createElement("div");
            errorDiv.className = "error-message";
            errorDiv.textContent = message;
            
            // Вставляем в чат
            chatBox.appendChild(errorDiv);
            scrollToBottom();
            
            // Автоматически убираем через 5 секунд
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }

        function scrollToBottom() {
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Работа с историей чата
        function getStorageKey() {
            return `${CONFIG.STORAGE_PREFIX}history_${sessionId}`;
        }

        function loadChatHistory() {
            try {
                const raw = localStorage.getItem(getStorageKey());
                if (!raw) return;
                
                const history = JSON.parse(raw);
                if (!Array.isArray(history)) return;
                
                history.forEach(({ sender, text, timestamp }) => {
                    if (sender && text && typeof text === 'string') {
                        const messageDate = timestamp ? new Date(timestamp) : new Date();
                        renderMessage(sender, text, messageDate);
                    }
                });
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        }

        function appendToHistory(sender, text) {
            try {
                const history = JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
                history.push({ 
                    sender, 
                    text, 
                    timestamp: new Date().toISOString() 
                });
                
                // Ограничиваем размер истории (последние 100 сообщений)
                if (history.length > 100) {
                    history.splice(0, history.length - 100);
                }
                
                localStorage.setItem(getStorageKey(), JSON.stringify(history));
            } catch (error) {
                console.error('Failed to save to history:', error);
            }
        }

        // Функция для очистки истории (можно вызвать из консоли)
        function clearChatHistory() {
            try {
                localStorage.removeItem(getStorageKey());
                chatBox.innerHTML = '';
                lastMessageDate = null;
                console.log('Chat history cleared');
            } catch (error) {
                console.error('Failed to clear history:', error);
            }
        }

        // Экспорт для отладки
        window.chatDebug = {
            clearHistory: clearChatHistory,
            getSessionId: () => sessionId,
            getConfig: () => CONFIG
        };
