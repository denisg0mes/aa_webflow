// Состояние чекбокса
let isChecked = false;

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

// Инициализация чекбокса
function initCheckbox() {
    const customCheckbox = document.getElementById('agreementCheckbox');
    const checkboxContainer = document.querySelector('.checkbox-container');
    
    if (customCheckbox && checkboxContainer) {
        checkboxContainer.addEventListener('click', function(e) {
            // Не активируем чекбокс если клик по ссылке
            if (e.target.tagName === 'A') {
                return;
            }

            isChecked = !isChecked;
            customCheckbox.classList.toggle('checked', isChecked);
            
            console.log('Checkbox state:', isChecked);
        });
    }
}

// Валидация формы (для использования при отправке)
function validateForm() {
    let isValid = true;
    
    // Проверяем все поля
    document.querySelectorAll('.field').forEach(field => {
        const input = field.querySelector('.input');
        validateField(field, input);
        
        // Если есть ошибка - форма невалидна
        if (field.querySelector('.error-message.show')) {
            isValid = false;
        }
    });
    
    // Проверяем чекбокс
    if (!isChecked) {
        alert('Please agree to the Terms and Conditions');
        isValid = false;
    }
    
    return isValid;
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

// Инициализация чекбокса
initCheckbox();

// Пример использования при отправке формы
// document.getElementById('submitButton').addEventListener('click', function(e) {
//     e.preventDefault();
//     if (validateForm()) {
//         console.log('Form is valid, submitting...');
//         // Отправка формы
//     }
// });
