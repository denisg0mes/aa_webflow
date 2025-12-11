(function() {
  // Валидация email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Валидация имени
  function isValidName(name) {
    return name.trim().length >= 2;
  }

  // Toast уведомления (глобальный, общий для всех форм)
  function showToast(message, isError = false, duration = 6000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.warn('Toast container not found');
      alert(message); // Fallback
      return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

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
      const message = data.message || 'Thank you for subscribing!';
      showToast(message, false);
    }
  }

  function initNewsletterForm(container) {
    if (!container) return;

    // Локальное состояние чекбокса
    let isChecked = false;

    const nameField  = container.querySelector('.field input#nameInput, .field input[name="name"], .field[data-field="name"] .input');
    const emailField = container.querySelector('.field input#emailInput, .field input[type="email"], .field[data-field="email"] .input');
    const nameWrapper  = nameField  ? nameField.closest('.field')  : null;
    const emailWrapper = emailField ? emailField.closest('.field') : null;

    const allFields = container.querySelectorAll('.field');

    const checkboxContainer = container.querySelector('.checkbox-container');
    const checkbox          = container.querySelector('#agreementCheckbox, .form-checkbox');
    const checkboxError     = container.querySelector('.checkbox-error');
    const submitButton      = container.querySelector('#submitButton, .submit-button');

    if (!submitButton) {
      console.warn('Submit button not found in newsletter container', container);
      return;
    }

    const originalButtonText = submitButton.textContent.trim() || 'Subscribe';

    // Показать ошибку поля
    function showError(fieldEl, message) {
      if (!fieldEl) return;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input = fieldEl.querySelector('.input');
      if (errorMessage && input) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        input.classList.add('error');
      }
    }

    // Скрыть ошибку поля
    function hideError(fieldEl) {
      if (!fieldEl) return;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input = fieldEl.querySelector('.input');
      if (errorMessage && input) {
        errorMessage.classList.remove('show');
        input.classList.remove('error');
      }
    }

    function showCheckboxError(message) {
      if (!checkboxError) return;
      checkboxError.textContent = message;
      checkboxError.classList.add('show');
    }

    function hideCheckboxError() {
      if (!checkboxError) return;
      checkboxError.classList.remove('show');
    }

    // Обновить состояние лейбла
    function updateLabel(fieldEl) {
      if (!fieldEl) return;
      const input = fieldEl.querySelector('.input');
      const label = fieldEl.querySelector('.floating-label');
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
    function validateField(fieldEl, input) {
      if (!fieldEl || !input) return true;

      const value = input.value.trim();
      const inputId = input.id || '';

      if (input === emailField || input.type === 'email' || inputId === 'emailInput') {
        if (!value) {
          showError(fieldEl, 'Email is required');
          return false;
        } else if (!isValidEmail(value)) {
          showError(fieldEl, 'Enter a valid email address');
          return false;
        } else {
          hideError(fieldEl);
          return true;
        }
      } else if (input === nameField || inputId === 'nameInput') {
        if (!value) {
          showError(fieldEl, 'Name is required');
          return false;
        } else if (!isValidName(value)) {
          showError(fieldEl, 'Name must be at least 2 characters');
          return false;
        } else {
          hideError(fieldEl);
          return true;
        }
      }

      return true;
    }

    // Полная валидация формы
    function validateForm() {
      let isValid = true;

      allFields.forEach(fieldEl => {
        const input = fieldEl.querySelector('.input');
        if (!validateField(fieldEl, input)) {
          isValid = false;
        }
      });

      if (checkboxContainer && !isChecked) {
        showCheckboxError('Please agree to the Terms and Conditions and Privacy Policy');
        isValid = false;
      } else {
        hideCheckboxError();
      }

      return isValid;
    }

    // Сброс формы
    function resetForm() {
      allFields.forEach(fieldEl => {
        const input = fieldEl.querySelector('.input');
        if (input) input.value = '';
        hideError(fieldEl);
        updateLabel(fieldEl);
      });

      isChecked = false;
      if (checkbox) {
        checkbox.classList.remove('checked');
      }

      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }

    // Отправка данных на сервер
    function submitFormData(formData) {
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

        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      });
    }

    // Инициализация полей
    allFields.forEach(fieldEl => {
      const input = fieldEl.querySelector('.input');
      if (!input) return;

      input.addEventListener('focus', function() {
        updateLabel(fieldEl);
      });

      input.addEventListener('blur', function() {
        updateLabel(fieldEl);
        if (input.value.trim()) {
          validateField(fieldEl, input);
        }
      });

      input.addEventListener('input', function() {
        updateLabel(fieldEl);
        const errorMessage = fieldEl.querySelector('.error-message');
        if (errorMessage && errorMessage.classList.contains('show')) {
          hideError(fieldEl);
        }
      });

      // Инициализация лейбла
      updateLabel(fieldEl);
    });

    // Инициализация чекбокса
    if (checkbox && checkboxContainer) {
      checkboxContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return;

        isChecked = !isChecked;
        if (isChecked) {
          checkbox.classList.add('checked');
          hideCheckboxError();
        } else {
          checkbox.classList.remove('checked');
        }
      });
    }

    // Инициализация формы
    submitButton.addEventListener('click', function(e) {
      e.preventDefault();

      if (!validateForm()) {
        console.log('Form validation failed');
        return;
      }

      submitButton.textContent = 'Subscribing...';
      submitButton.disabled = true;

      const formData = {
        name:  nameField  ? nameField.value.trim()  : '',
        email: emailField ? emailField.value.trim() : '',
        agreedToTerms: isChecked,
        timestamp: new Date().toISOString(),
        source: 'website_newsletter'
      };

      console.log('Form data:', formData);
      submitFormData(formData);
    });
  }

  function initAllNewsletterForms() {
    const containers = document.querySelectorAll('.newsletter-container');
    if (!containers.length) {
      console.log('No newsletter containers found');
      return;
    }
    containers.forEach(initNewsletterForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllNewsletterForms);
  } else {
    initAllNewsletterForms();
  }
})();
