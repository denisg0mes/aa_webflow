const emailInput = document.getElementById('emailInput');
const floatingLabel = document.getElementById('floatingLabel');
const errorMessage = document.getElementById('errorMessage');

// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    emailInput.classList.add('error');
}

// Скрыть ошибку
function hideError() {
    errorMessage.classList.remove('show');
    emailInput.classList.remove('error');
}

// Обновить состояние лейбла
function updateLabel() {
    console.log('updateLabel called');
    console.log('Input focused:', emailInput === document.activeElement);
    console.log('Input value:', emailInput.value);
    
    const isFocused = emailInput === document.activeElement;
    const hasValue = emailInput.value.trim() !== '';
    
    if (isFocused || hasValue) {
        console.log('Activating label');
        floatingLabel.classList.add('active');
    } else {
        console.log('Deactivating label');
        floatingLabel.classList.remove('active');
    }
}

// События для полей
emailInput.addEventListener('focus', function() {
    console.log('Focus event');
    updateLabel();
});

emailInput.addEventListener('blur', function() {
    console.log('Blur event');
    updateLabel();
    
    // Валидация при потере фокуса
    const email = this.value.trim();
    if (email && !isValidEmail(email)) {
        showError('Enter a valid email address');
    } else if (email === '') {
        hideError();
    } else {
        hideError();
    }
});

emailInput.addEventListener('input', function() {
    console.log('Input event, value:', this.value);
    updateLabel();
    
    // Очистка ошибки при вводе
    if (errorMessage.classList.contains('show')) {
        hideError();
    }
});

// Инициализация
updateLabel();
