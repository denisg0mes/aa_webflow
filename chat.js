// Конфигурация
const CONFIG = {
    MAX_MESSAGE_LENGTH: 1000,
    WEBHOOK_URL: "https://n8n.arrivedaliens.com/webhook/chat",
    STORAGE_PREFIX: "secure_chat_",
    REQUEST_TIMEOUT: 30000,
    TYPING_SPEED: 30,
    ERROR_DISPLAY_TIME: 5000,
    FOCUS_DELAY: 100,
    TEXTAREA_MIN_HEIGHT: 48,
    TEXTAREA_MAX_HEIGHT: 120,
    THROTTLE_DELAY: 100,
    DEBOUNCE_DELAY: 50,
    MESSAGES_PER_LOAD: 10,
    INTERSECTION_ROOT_MARGIN: '50px' // Триггер за 50px до появления sentinel
};

// Состояние приложения
let isLoading = false;
let sessionId = null;
let currentDisplayedCount = 0;
let currentTypingCancel = null;

// Infinity scroll state
let isLoadingHistory = false;
let scrollSentinel = null;
let intersectionObserver = null;

// DOM элементы
let chatBox, userInput, sendButton, charCounter;

// Утилиты для производительности
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        }
    };
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Безопасные функции для localStorage
function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn('localStorage unavailable:', e);
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.warn('localStorage unavailable:', e);
        return false;
    }
}

function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.warn('localStorage unavailable:', e);
        return false;
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', initializeChat);

function initializeChat() {
    // Получение DOM элементов
    chatBox = document.getElementById("chat_box");
    userInput = document.getElementById("user_input");
    sendButton = document.getElementById("chatButton");
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
        sessionId = safeLocalStorageGet(`${CONFIG.STORAGE_PREFIX}session_id`);
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            safeLocalStorageSet(`${CONFIG.STORAGE_PREFIX}session_id`, sessionId);
        }
    } catch (error) {
        console.error('Session initialization failed:', error);
        sessionId = Date.now().toString(); // Fallback
    }
}

function setupEventListeners() {
    // Автоматическое изменение высоты textarea с debouncing
    userInput.addEventListener('input', debounce(() => {
        autoResizeTextarea();
        updateCharCounter();
    }, CONFIG.DEBOUNCE_DELAY));

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

    // Обработчик прокрутки заменен на Intersection Observer
    setupInfiniteScroll();
    
    // Инициализация счетчика
    updateCharCounter();
}

// =====================================================
// INFINITY SCROLL SYSTEM с Intersection Observer API
// =====================================================

/**
 * Инициализирует систему бесконечной прокрутки
 * Использует современный Intersection Observer API вместо scroll events
 */
function setupInfiniteScroll() {
    if (!chatBox) {
        console.error('Chat box not found for infinite scroll setup');
        return;
    }

    // Очищаем предыдущий observer если есть
    cleanupInfiniteScroll();

    // Проверяем поддержку API
    if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, falling back to scroll events');
        setupScrollFallback();
        return;
    }

    // Создаем sentinel element только если есть история для загрузки
    const fullHistory = getFullHistory();
    if (fullHistory.length <= currentDisplayedCount) {
        console.log('No more history to load, skipping infinite scroll setup');
        return;
    }

    createScrollSentinel();
    createIntersectionObserver();
    
    console.log('✅ Infinite scroll initialized with Intersection Observer');
}

/**
 * Создает sentinel элемент - невидимый маркер для отслеживания прокрутки
 */
function createScrollSentinel() {
    scrollSentinel = document.createElement('div');
    scrollSentinel.className = 'scroll-sentinel';
    scrollSentinel.setAttribute('data-testid', 'scroll-sentinel');
    
    // Стили для debugging (можно убрать в production)
    scrollSentinel.style.cssText = `
        height: 1px;
        width: 100%;
        position: absolute;
        top: 0;
        background: transparent;
        pointer-events: none;
    `;

    // Вставляем в начало чата
    if (chatBox.firstChild) {
        chatBox.insertBefore(scrollSentinel, chatBox.firstChild);
    } else {
        chatBox.appendChild(scrollSentinel);
    }
}

/**
 * Создает и конфигурирует Intersection Observer
 */
function createIntersectionObserver() {
    const options = {
        root: chatBox,
        rootMargin: `${CONFIG.INTERSECTION_ROOT_MARGIN} 0px 0px 0px`,
        threshold: 0
    };

    intersectionObserver = new IntersectionObserver(handleIntersection, options);
    intersectionObserver.observe(scrollSentinel);
}

/**
 * Обработчик пересечения sentinel с viewport
 * @param {IntersectionObserverEntry[]} entries - массив наблюдаемых элементов
 */
function handleIntersection(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !isLoadingHistory) {
            console.log('🎯 Sentinel intersected, triggering load more');
            loadMoreHistoryClean();
        }
    });
}

/**
 * Fallback для браузеров без поддержки IntersectionObserver
 */
function setupScrollFallback() {
    console.log('Setting up scroll fallback');
    chatBox.addEventListener('scroll', throttle(() => {
        if (!isLoadingHistory && chatBox.scrollTop <= 100) {
            loadMoreHistoryClean();
        }
    }, CONFIG.THROTTLE_DELAY));
}

/**
 * Чистая реализация загрузки истории
 * Следует принципам SOLID и clean architecture
 */
async function loadMoreHistoryClean() {
    // Guard clauses
    if (isLoadingHistory) {
        console.log('Already loading history, skipping');
        return;
    }

    const historyData = getHistoryLoadingData();
    if (!historyData.hasMore) {
        console.log('No more history to load');
        cleanupInfiniteScroll();
        return;
    }

    try {
        await executeHistoryLoading(historyData);
    } catch (error) {
        console.error('Failed to load history:', error);
        showError('Failed to load more messages');
    } finally {
        isLoadingHistory = false;
    }
}

/**
 * Получает данные для загрузки истории
 * @returns {Object} Объект с данными для загрузки
 */
function getHistoryLoadingData() {
    const fullHistory = getFullHistory();
    const totalMessages = fullHistory.length;
    const remainingMessages = totalMessages - currentDisplayedCount;
    const messagesToLoad = Math.min(CONFIG.MESSAGES_PER_LOAD, remainingMessages);
    
    return {
        fullHistory,
        totalMessages,
        remainingMessages,
        messagesToLoad,
        hasMore: remainingMessages > 0,
        startIndex: totalMessages - currentDisplayedCount - messagesToLoad,
        endIndex: totalMessages - currentDisplayedCount
    };
}

/**
 * Выполняет загрузку истории с сохранением позиции прокрутки
 * @param {Object} historyData - данные для загрузки
 */
async function executeHistoryLoading(historyData) {
    isLoadingHistory = true;
    console.log(`📥 Loading ${historyData.messagesToLoad} messages (${historyData.remainingMessages} remaining)`);

    // Показываем индикатор загрузки
    showLoadingIndicator();

    // Получаем порцию сообщений
    const messagesChunk = historyData.fullHistory.slice(
        historyData.startIndex, 
        historyData.endIndex
    );

    if (messagesChunk.length === 0) {
        hideLoadingIndicator();
        return;
    }

    // Сохраняем scroll state для restoration
    const scrollState = captureScrollState();

    // Добавляем сообщения
    await renderHistoryMessages(messagesChunk);

    // Обновляем состояние
    currentDisplayedCount += historyData.messagesToLoad;
    console.log(`📊 Updated count: ${currentDisplayedCount}/${historyData.totalMessages}`);

    // Восстанавливаем позицию прокрутки
    restoreScrollPosition(scrollState);

    // Управляем UI состоянием
    hideLoadingIndicator();
    updateInfiniteScrollState(historyData);
}

/**
 * Захватывает текущее состояние прокрутки для restoration
 */
function captureScrollState() {
    return {
        scrollHeight: chatBox.scrollHeight,
        scrollTop: chatBox.scrollTop
    };
}

/**
 * Рендерит сообщения из истории
 * @param {Array} messagesChunk - порция сообщений для рендера
 */
async function renderHistoryMessages(messagesChunk) {
    const fragment = document.createDocumentFragment();
    
    messagesChunk.forEach(({ sender, text, timestamp }) => {
        if (sender && text && typeof text === 'string') {
            const messageElement = createHistoryMessageElement(sender, text, timestamp);
            fragment.appendChild(messageElement);
        }
    });

    // Вставляем все сообщения одной операцией для лучшей производительности
    if (scrollSentinel && scrollSentinel.nextSibling) {
        chatBox.insertBefore(fragment, scrollSentinel.nextSibling);
    } else if (chatBox.firstChild) {
        chatBox.insertBefore(fragment, chatBox.firstChild);
    } else {
        chatBox.appendChild(fragment);
    }
}

/**
 * Создает элемент сообщения для истории
 * @param {string} sender - отправитель
 * @param {string} text - текст сообщения  
 * @param {string} timestamp - временная метка
 * @returns {HTMLElement} элемент сообщения
 */
function createHistoryMessageElement(sender, text, timestamp) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container ${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}`;
    bubble.textContent = text;
    
    messageContainer.appendChild(bubble);
    return messageContainer;
}

/**
 * Восстанавливает позицию прокрутки после добавления контента
 * @param {Object} scrollState - сохраненное состояние прокрутки
 */
function restoreScrollPosition(scrollState) {
    const newScrollHeight = chatBox.scrollHeight;
    const heightDiff = newScrollHeight - scrollState.scrollHeight;
    
    // Оптимальная позиция: сохраняем relative position + небольшой offset
    const targetScrollTop = scrollState.scrollTop + heightDiff + 50;
    
    chatBox.scrollTop = targetScrollTop;
    console.log(`📍 Scroll restored: ${scrollState.scrollTop} → ${targetScrollTop} (diff: ${heightDiff})`);
}

/**
 * Обновляет состояние системы бесконечной прокрутки
 * @param {Object} historyData - данные загрузки
 */
function updateInfiniteScrollState(historyData) {
    const stillRemaining = historyData.totalMessages - currentDisplayedCount;
    
    if (stillRemaining > 0) {
        console.log(`📋 ${stillRemaining} messages remaining`);
        showLoadMoreIndicator();
    } else {
        console.log('🏁 All messages loaded');
        cleanupInfiniteScroll();
        hideLoadMoreIndicator();
    }
}

/**
 * Очищает ресурсы системы бесконечной прокрутки
 */
function cleanupInfiniteScroll() {
    if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
        console.log('🧹 Intersection Observer cleaned up');
    }
    
    if (scrollSentinel && scrollSentinel.parentNode) {
        scrollSentinel.parentNode.removeChild(scrollSentinel);
        scrollSentinel = null;
        console.log('🧹 Scroll sentinel removed');
    }
}

function getFullHistory() {
    try {
        const raw = safeLocalStorageGet(getStorageKey());
        if (!raw) return [];
        
        const history = JSON.parse(raw);
        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.error('Failed to get full history:', error);
        return [];
    }
}

function loadMoreHistory() {
    const fullHistory = getFullHistory();
    const totalMessages = fullHistory.length;
    
    console.log(`Load more: ${currentDisplayedCount}/${totalMessages} messages shown`);
    
    // Проверяем, есть ли еще сообщения для загрузки
    if (currentDisplayedCount >= totalMessages) {
        console.log('All messages already loaded');
        hideLoadingIndicator();
        hideLoadMoreIndicator();
        hideLoadingIndicator();
        return; // Все сообщения уже загружены
    }
    
    // Вычисляем сколько еще нужно загрузить
    const remainingMessages = totalMessages - currentDisplayedCount;
    const messagesToLoad = Math.min(CONFIG.MESSAGES_PER_LOAD, remainingMessages);
    
    console.log(`Loading ${messagesToLoad} more messages`);
    
    // Берем следующую порцию сообщений (с конца истории, но раньше уже показанных)
    const startIndex = totalMessages - currentDisplayedCount - messagesToLoad;
    const endIndex = totalMessages - currentDisplayedCount;
    const messagesChunk = fullHistory.slice(startIndex, endIndex);
    
    if (messagesChunk.length === 0) return;
    
    // Убираем индикатор загрузки
    hideLoadingIndicator();
    
    // Запоминаем текущую позицию прокрутки
    const scrollHeight = chatBox.scrollHeight;
    const scrollTop = chatBox.scrollTop;
    
    // Добавляем сообщения в начало чата
    messagesChunk.forEach(({ sender, text, timestamp }) => {
        if (sender && text && typeof text === 'string') {
            prependMessage(sender, text, timestamp);
        }
    });
    
    // Обновляем счетчик отображаемых сообщений
    currentDisplayedCount += messagesToLoad;
    
    // Восстанавливаем позицию прокрутки (чтобы чат не "прыгал")
    const newScrollHeight = chatBox.scrollHeight;
    chatBox.scrollTop = newScrollHeight - scrollHeight + scrollTop;
    
    // Показываем новый индикатор если есть еще сообщения
    if (currentDisplayedCount < totalMessages) {
        console.log(`Still ${totalMessages - currentDisplayedCount} messages remaining`);
        showLoadMoreIndicator();
    } else {
        console.log('All messages loaded');
    }
}

function prependMessage(sender, text, messageTimestamp = null) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container ${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}`;
    bubble.textContent = text;
    
    messageContainer.appendChild(bubble);
    
    // Вставляем в начало чата
    chatBox.insertBefore(messageContainer, chatBox.firstChild);
    
    return messageContainer;
}

function autoResizeTextarea() {
    // Сброс высоты для правильного пересчета
    userInput.style.height = 'auto';
    
    // Вычисляем нужную высоту
    let newHeight = Math.max(CONFIG.TEXTAREA_MIN_HEIGHT, userInput.scrollHeight);
    newHeight = Math.min(newHeight, CONFIG.TEXTAREA_MAX_HEIGHT);
    
    userInput.style.height = newHeight + 'px';
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
        
        // Показываем ответ с анимацией печати
        renderMessage("bot", reply, null, true); // animated = true
        appendToHistory("bot", reply);
        
    } catch (error) {
        console.error('Send message error:', error);
        const errorMessage = getErrorMessage(error);
        
        // Убираем индикатор загрузки если есть
        const loader = chatBox.querySelector('.loader');
        if (loader) {
            removeLoader(loader.closest('.message-container'));
        }
        
        renderMessage("bot", errorMessage, null, true); // С анимацией
        appendToHistory("bot", errorMessage);
    } finally {
        setLoadingState(false);
        
        // Возвращаем фокус на поле ввода
        setTimeout(() => {
            if (userInput && userInput.parentNode) {
                userInput.focus();
            }
        }, CONFIG.FOCUS_DELAY);
    }
}

async function sendToAPI(message) {
    // Проверяем интернет соединение
    if (!navigator.onLine) {
        throw new Error('No internet connection');
    }

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
    
    // Просто делаем кнопку disabled, без изменения содержимого
}

function getErrorMessage(error) {
    if (error.name === 'AbortError') {
        return "Request timed out. Please try again.";
    } else if (error.message.includes('No internet connection')) {
        return "No internet connection. Please check your network.";
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

function renderMessage(sender, text, messageTimestamp = null, animated = false) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-container ${sender}`;
    
    const bubble = document.createElement("div");
    bubble.className = `bubble ${sender}`;
    
    if (sender === "user") {
        // Для пользователя: просто текст
        bubble.textContent = text;
        messageContainer.appendChild(bubble);
        chatBox.appendChild(messageContainer);
    } else {
        // Для бота: текст без фона
        messageContainer.appendChild(bubble);
        chatBox.appendChild(messageContainer);
        
        if (animated) {
            // Отменяем предыдущую анимацию
            if (currentTypingCancel) {
                currentTypingCancel();
                currentTypingCancel = null;
            }
            
            // ПРОСТОЕ решение: сначала показываем полный текст (невидимый)
            bubble.textContent = text;
            bubble.style.visibility = 'hidden';
            
            // Принудительный reflow для получения финальной высоты
            const finalHeight = bubble.offsetHeight;
            
            // Теперь готовим к анимации
            bubble.textContent = "";
            bubble.style.visibility = 'visible';
            bubble.style.height = finalHeight + 'px';
            bubble.style.overflow = 'hidden';
            
            // Запускаем простую анимацию
            currentTypingCancel = typeWriterSimple(bubble, text, finalHeight);
        } else {
            bubble.textContent = text;
        }
    }
    
    scrollToBottom();
    return messageContainer;
}

function showLoadMoreIndicator() {
    // Удаляем предыдущий индикатор если есть
    const existingIndicator = chatBox.querySelector('.load-more-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const fullHistory = getFullHistory();
    const remainingMessages = fullHistory.length - currentDisplayedCount;
    
    if (remainingMessages > 0) {
        const indicator = document.createElement('div');
        indicator.className = 'load-more-indicator';
        indicator.innerHTML = `↑ Scroll up to load ${Math.min(CONFIG.MESSAGES_PER_LOAD, remainingMessages)} more messages`;
        indicator.style.cssText = `
            text-align: center;
            padding: 8px 12px;
            color: #666;
            font-size: 12px;
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
            background: #f8f9fa;
            animation: shimmer 2s ease-in-out infinite;
        `;
        
        chatBox.insertBefore(indicator, chatBox.firstChild);
    }
}

function showLoadingIndicator() {
    // Удаляем индикатор "load more"
    hideLoadMoreIndicator();
    
    const indicator = document.createElement('div');
    indicator.className = 'loading-more-indicator';
    indicator.innerHTML = 'Loading more messages';
    indicator.style.cssText = `
        text-align: center;
        padding: 8px 12px;
        color: #666;
        font-size: 12px;
        border-bottom: 1px solid #eee;
        margin-bottom: 10px;
        background: #f0f0f0;
        animation: shimmer 2s ease-in-out infinite;
    `;
    
    chatBox.insertBefore(indicator, chatBox.firstChild);
}

function hideLoadMoreIndicator() {
    const indicator = chatBox.querySelector('.load-more-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function hideLoadingIndicator() {
    const indicator = chatBox.querySelector('.loading-more-indicator');
    if (indicator) {
        indicator.remove();
    }
}
function typeWriterSimple(element, text, finalHeight) {
    let currentText = "";
    let index = 0;
    let animationId;
    let cancelled = false;
    
    function animate() {
        if (cancelled || !element || !element.parentNode) {
            // Простая гарантия: показываем весь текст
            if (element && element.parentNode) {
                element.textContent = text;
                element.style.height = 'auto';
                element.style.overflow = 'visible';
            }
            return;
        }
        
        if (index < text.length) {
            currentText += text[index];
            element.textContent = currentText;
            index++;
            
            // Используем setTimeout для контролируемой задержки
            animationId = setTimeout(animate, CONFIG.TYPING_SPEED);
        } else {
            // Анимация завершена
            element.style.height = 'auto';
            element.style.overflow = 'visible';
            scrollToBottom(); // Финальная прокрутка
        }
    }
    
    animate();
    
    // Простая функция отмены
    return () => {
        cancelled = true;
        if (animationId) {
            clearTimeout(animationId);
        }
        // Гарантированно показываем полный текст
        if (element && element.parentNode) {
            element.textContent = text;
            element.style.height = 'auto';
            element.style.overflow = 'visible';
        }
    };
}

function renderLoader() {
    const messageContainer = document.createElement("div");
    messageContainer.className = "message-container bot";
    
    const bubble = document.createElement("div");
    bubble.className = "bubble bot loader";
    bubble.textContent = "Thinking";
    bubble.style.animation = "shimmer 2s ease-in-out infinite";
    
    messageContainer.appendChild(bubble);
    chatBox.appendChild(messageContainer);
    scrollToBottom();
    
    return messageContainer;
}

function removeLoader(loaderElement) {
    if (loaderElement && loaderElement.parentNode) {
        try {
            loaderElement.parentNode.removeChild(loaderElement);
        } catch (e) {
            console.warn('Failed to remove loader:', e);
        }
    }
}

function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    
    // Вставляем в чат
    chatBox.appendChild(errorDiv);
    scrollToBottom();
    
    // Автоматически убираем через заданное время
    setTimeout(() => {
        if (errorDiv.parentNode) {
            try {
                errorDiv.parentNode.removeChild(errorDiv);
            } catch (e) {
                console.warn('Failed to remove error message:', e);
            }
        }
    }, CONFIG.ERROR_DISPLAY_TIME);
}

function scrollToBottom() {
    if (chatBox && chatBox.parentNode) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Работа с историей чата
function getStorageKey() {
    return `${CONFIG.STORAGE_PREFIX}history_${sessionId}`;
}

function loadChatHistory() {
    try {
        const fullHistory = getFullHistory();
        if (fullHistory.length === 0) return;
        
        console.log(`Total messages in storage: ${fullHistory.length}`);
        
        // Загружаем только последние CONFIG.MESSAGES_PER_LOAD сообщений
        const messagesToShow = Math.min(CONFIG.MESSAGES_PER_LOAD, fullHistory.length);
        const recentMessages = fullHistory.slice(-messagesToShow);
        
        console.log(`Showing last ${messagesToShow} messages`);
        
        recentMessages.forEach(({ sender, text, timestamp }) => {
            if (sender && text && typeof text === 'string') {
                renderMessage(sender, text, timestamp, false); // Без анимации для истории
            }
        });
        
        // Устанавливаем счетчик отображаемых сообщений
        currentDisplayedCount = messagesToShow;
        
        // Показываем индикатор если есть еще сообщения для загрузки
        if (fullHistory.length > CONFIG.MESSAGES_PER_LOAD) {
            // Инициализируем infinite scroll после загрузки истории
            setTimeout(() => {
                setupInfiniteScroll();
            }, 100);
        }
        
    } catch (error) {
        console.error('Failed to load chat history:', error);
    }
}

function appendToHistory(sender, text) {
    try {
        const history = JSON.parse(safeLocalStorageGet(getStorageKey()) || '[]');
        history.push({ 
            sender, 
            text, 
            timestamp: new Date().toISOString() 
        });
        
        // НЕ ограничиваем размер истории - храним всё
        safeLocalStorageSet(getStorageKey(), JSON.stringify(history));
        
        // Увеличиваем счетчик отображаемых сообщений (новое сообщение добавилось в DOM)
        currentDisplayedCount++;
        
    } catch (error) {
        console.error('Failed to save to history:', error);
    }
}

// Функция для очистки истории (можно вызвать из консоли)
function clearChatHistory() {
    try {
        safeLocalStorageRemove(getStorageKey());
        if (chatBox) {
            chatBox.innerHTML = '';
        }
        currentDisplayedCount = 0;
        // Отменяем текущую анимацию печати
        if (currentTypingCancel) {
            currentTypingCancel();
            currentTypingCancel = null;
        }
        hideLoadMoreIndicator();
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
