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

// Показать ошибку поля
function showError(field, message) {
    const errorMessage = field.querySelector('.error-message');
    const input = field.querySelector('.input');
    
    if (errorMessage && input) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        input.classList.add('error');
    }
}

// Скрыть ошибку поля
function hideError(field) {
    const errorMessage = field.querySelector('.error-message');
    const input = field.querySelector('.input');
    
    if (errorMessage && input) {
        errorMessage.classList.remove('show');
        input.classList.remove('error');
    }
}

// Показать ошибку чекбокса
function showCheckboxError(message) {
    const checkboxError = document.getElementById('checkboxError');
    if (checkboxError) {
        checkboxError.textContent = message;
        checkboxError.classList.add('show');
    }
}

// Скрыть ошибку чекбокса
function hideCheckboxError() {
    const checkboxError = document.getElementById('checkboxError');
    if (checkboxError) {
        checkboxError.classList.remove('show');
    }
}

// Обновить состояние лейбла
function updateLabel(field) {
    const input = field.querySelector('.input');
    const label = field.querySelector('.floating-label');
    
    if (!input || !label) return;
    
    const isFocused = input === document.activeElement;
    const hasValue = input.value.trim() !== '';
    
    if (isFocused || hasValue) {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}

// Валидация конкретного поля
function validateField(field, input) {
    if (!field || !input) return true;
    
    const value = input.value.trim();
    const inputId = input.id;
    
    if (inputId === 'emailInput') {
        if (!value) {
            showError(field, 'Email is required');
            return false;
        } else if (!isValidEmail(value)) {
            showError(field, 'Enter a valid email address');
            return false;
        } else {
            hideError(field);
            return true;
        }
    } else if (inputId === 'nameInput') {
        if (!value) {
            showError(field, 'Name is required');
            return false;
        } else if (!isValidName(value)) {
            showError(field, 'Name must be at least 2 characters');
            return false;
        } else {
            hideError(field);
            return true;
        }
    }
    
    return true;
}

// Полная валидация формы
function validateForm() {
    let isValid = true;
    
    // Проверяем все поля
    const fields = document.querySelectorAll('.field');
    fields.forEach(field => {
        const input = field.querySelector('.input');
        if (!validateField(field, input)) {
            isValid = false;
        }
    });
    
    // Проверяем чекбокс
    if (!isChecked) {
        showCheckboxError('Please agree to the Terms and Conditions and Privacy Policy');
        isValid = false;
    } else {
        hideCheckboxError();
    }
    
    return isValid;
}

// Инициализация полей
function initFields() {
    const fields = document.querySelectorAll('.field');
    
    fields.forEach(field => {
        const input = field.querySelector('.input');
        if (!input) return;
        
        // Фокус
        input.addEventListener('focus', function() {
            updateLabel(field);
        });
        
        // Потеря фокуса
        input.addEventListener('blur', function() {
            updateLabel(field);
            // Валидируем только если поле заполнено
            if (input.value.trim()) {
                validateField(field, input);
            }
        });
        
        // Ввод текста
        input.addEventListener('input', function() {
            updateLabel(field);
            
            // Убираем ошибку при вводе
            const errorMessage = field.querySelector('.error-message');
            if (errorMessage && errorMessage.classList.contains('show')) {
                hideError(field);
            }
        });
        
        // Инициализация лейбла
        updateLabel(field);
    });
}

// Инициализация чекбокса
function initCheckbox() {
    const checkbox = document.getElementById('agreementCheckbox');
    const container = document.querySelector('.checkbox-container');
    
    console.log('Initializing checkbox:', checkbox, container);
    
    if (checkbox && container) {
        container.addEventListener('click', function(e) {
            console.log('Checkbox container clicked');
            
            // Игнорируем клики по ссылкам
            if (e.target.tagName === 'A') {
                console.log('Link clicked, ignoring');
                return;
            }
            
            // Переключаем состояние
            isChecked = !isChecked;
            
            if (isChecked) {
                checkbox.classList.add('checked');
                hideCheckboxError();
            } else {
                checkbox.classList.remove('checked');
            }
            
            console.log('Checkbox state changed to:', isChecked);
        });
    } else {
        console.error('Checkbox elements not found');
    }
}

// Инициализация формы
function initForm() {
    const submitButton = document.getElementById('submitButton');
    
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('Submit button clicked');
            
            if (validateForm()) {
                console.log('Form is valid, submitting...');
                
                // Блокируем кнопку
                submitButton.textContent = 'Subscribing...';
                submitButton.disabled = true;
                
                // Получаем данные
                const formData = {
                    name: document.getElementById('nameInput')?.value.trim() || '',
                    email: document.getElementById('emailInput')?.value.trim() || '',
                    agreedToTerms: isChecked
                };
                
                console.log('Form data:', formData);
                
                // Имитация отправки
                setTimeout(() => {
                    alert('Thank you for subscribing!');
                    
                    // Сброс формы
                    const nameInput = document.getElementById('nameInput');
                    const emailInput = document.getElementById('emailInput');
                    const checkbox = document.getElementById('agreementCheckbox');
                    
                    if (nameInput) nameInput.value = '';
                    if (emailInput) emailInput.value = '';
                    
                    isChecked = false;
                    if (checkbox) checkbox.classList.remove('checked');
                    
                    // Обновляем лейблы
                    document.querySelectorAll('.field').forEach(field => {
                        updateLabel(field);
                    });
                    
                    // Восстанавливаем кнопку
                    submitButton.textContent = 'Subscribe';
                    submitButton.disabled = false;
                    
                }, 2000);
                
            } else {
                console.log('Form validation failed');
            }
        });
    }
}

// Главная инициализация
function init() {
    console.log('Initializing form components...');
    
    initFields();
    initCheckbox();
    initForm();
    
    console.log('Form initialization complete');
}

// Запуск после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
