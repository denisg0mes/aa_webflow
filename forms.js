// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация имени
function isValidName(name) {
    return name.trim().length >= 2;
}

// Показать ошибку
function showError(field, message) {
    const errorMessage = field.querySelector('.error-message');
    const input = field.querySelector('.input');
    
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    input.classList.add('error');
}

// Скрыть ошибку
function hideError(field) {
    const errorMessage = field.querySelector('.error-message');
    const input = field.querySelector('.input');
    
    errorMessage.classList.remove('show');
    input.classList.remove('error');
}

// Обновить состояние лейбла
function updateLabel(field) {
    const input = field.querySelector('.input');
    const label = field.querySelector('.floating-label');
    
    const isFocused = input === document.activeElement;
    const hasValue = input.value.trim() !== '';
    
    if (isFocused || hasValue) {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}

// Валидация по ID
function validateField(field, input) {
    const value = input.value.trim();
    const inputId = input.id;
    
    if (inputId === 'emailInput' && value) {
        if (!isValidEmail(value)) {
            showError(field, 'Enter a valid email address');
        } else {
            hideError(field);
        }
    } else if (inputId === 'nameInput' && value) {
        if (!isValidName(value)) {
            showError(field, 'Name must be at least 2 characters');
        } else {
            hideError(field);
        }
    } else if (value === '') {
        hideError(field);
    }
}

// Инициализация всех полей
document.querySelectorAll('.field').forEach(field => {
    const input = field.querySelector('.input');
    
    // События для анимации лейбла
    input.addEventListener('focus', () => updateLabel(field));
    
    input.addEventListener('blur', () => {
        updateLabel(field);
        validateField(field, input);
    });
    
    input.addEventListener('input', () => {
        updateLabel(field);
        
        // Очистка ошибки при вводе
        const errorMessage = field.querySelector('.error-message');
        if (errorMessage.classList.contains('show')) {
            hideError(field);
        }
    });
    
    // Инициализация
    updateLabel(field);
});
