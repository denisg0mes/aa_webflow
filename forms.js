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

// Toast уведомления
function showToast(message, isError = false, duration = 6000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container not found');
        alert(message); // Fallback to alert
        return;
    }
    
    // Создаем элемент toast
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    
    // Добавляем в контейнер
    container.appendChild(toast);
    
    // Показываем с анимацией
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Убираем через заданное время
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400);
    }, duration);
}

// Обработка ответа от сервера
function handleServerResponse(data) {
    if (typeof data === 'string') {
        // Если получили просто текст
        showToast('Thank you for subscribing!', false);
        return;
    }
    
    if (data.success === true) {
        const message = data.message || 'Thank you for subscribing! Check your email for confirmation.';
        showToast(message, false);
    } else if (data.success === false) {
        const errorMessage = data.message || 'Something went wrong. Please try again.';
        showToast(errorMessage, true);
    } else {
        // Если success не указан, считаем успехом
        const message = data.message || 'Thank you for subscribing!';
        showToast(message, false);
    }
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

// Сброс формы
function resetForm() {
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const checkbox = document.getElementById('agreementCheckbox');
    const submitButton = document.getElementById('submitButton');
    
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    
    isChecked = false;
    if (checkbox) checkbox.classList.remove('checked');
    
    // Обновляем лейблы
    document.querySelectorAll('.field').forEach(field => {
        updateLabel(field);
    });
    
    // Восстанавливаем кнопку
    if (submitButton) {
        submitButton.textContent = 'Subscribe';
        submitButton.disabled = false;
    }
}

// Отправка данных на сервер
function submitFormData(formData, submitButton) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    return fetch('https://n8n.arrivedaliens.com/webhook/newsletter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text().then(text => ({ success: true, message: text }));
            }
        } else {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
    })
    .then(data => {
        console.log('Success:', data);
        handleServerResponse(data);
        resetForm();
    })
    .catch(error => {
        console.error('Error:', error);
        
        let errorMessage = 'Something went wrong. Please try again.';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('Server error')) {
            errorMessage = 'Server is temporarily unavailable. Please try again later.';
        }
        
        showToast(errorMessage, true);
        
        // Восстанавливаем кнопку при ошибке
        if (submitButton) {
            submitButton.textContent = 'Subscribe';
            submitButton.disabled = false;
        }
    });
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
                    agreedToTerms: isChecked,
                    timestamp: new Date().toISOString(),
                    source: 'website_newsletter'
                };
                
                console.log('Form data:', formData);
                
                // Отправляем данные
                submitFormData(formData, submitButton);
                
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
