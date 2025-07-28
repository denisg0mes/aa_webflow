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
    
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    input.classList.add('error');
}

// Скрыть ошибку поля
function hideError(field) {
    const errorMessage = field.querySelector('.error-message');
    const input = field.querySelector('.input');
    
    errorMessage.classList.remove('show');
    input.classList.remove('error');
}

// Показать ошибку чекбокса
function showCheckboxError(message) {
    const checkboxError = document.getElementById('checkboxError');
    checkboxError.textContent = message;
    checkboxError.classList.add('show');
}

// Скрыть ошибку чекбокса
function hideCheckboxError() {
    const checkboxError = document.getElementById('checkboxError');
    checkboxError.classList.remove('show');
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
    document.querySelectorAll('.field').forEach(field => {
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
            
            // Скрываем ошибку чекбокса если пользователь согласился
            if (isChecked) {
                hideCheckboxError();
            }
            
            console.log('Checkbox state:', isChecked);
        });
    }
}

// Инициализация всех полей
document.querySelectorAll('.field').forEach(field => {
    const input = field.querySelector('.input');
    
    // События для анимации лейбла
    input.addEventListener('focus', () => updateLabel(field));
    
    input.addEventListener('blur', () => {
        updateLabel(field);
        // Валидируем только при потере фокуса если поле не пустое
        if (input.value.trim()) {
            validateField(field, input);
        }
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

// Обработка отправки формы
document.getElementById('newsletterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    console.log('Form submission attempted');
    
    if (validateForm()) {
        console.log('Form is valid, submitting...');
        
        // Имитация отправки
        const submitButton = document.getElementById('submitButton');
        submitButton.textContent = 'Subscribing...';
        submitButton.disabled = true;
        
        // Получаем данные формы
        const formData = {
            name: document.getElementById('nameInput').value.trim(),
            email: document.getElementById('emailInput').value.trim(),
            agreedToTerms: isChecked
        };
        
        console.log('Form data:', formData);
        
        // Здесь добавьте реальную отправку данных
        setTimeout(() => {
            alert('Thank you for subscribing!');
            
            // Сброс формы
            document.getElementById('nameInput').value = '';
            document.getElementById('emailInput').value = '';
            isChecked = false;
            document.getElementById('agreementCheckbox').classList.remove('checked');
            
            // Обновляем лейблы
            document.querySelectorAll('.field').forEach(field => {
                updateLabel(field);
            });
            
            submitButton.textContent = 'Subscribe';
            submitButton.disabled = false;
        }, 2000);
        
    } else {
        console.log('Form validation failed');
    }
});

// Инициализация чекбокса
initCheckbox();
