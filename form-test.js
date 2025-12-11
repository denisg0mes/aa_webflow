(function () {
  /* ========= ВАЛИДАЦИЯ ========= */

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidName(name) {
    return name.trim().length >= 2;
  }

  function isValidMessage(message) {
    return message.trim().length >= 10;
  }

  /* ========= TOAST ========= */

  function showToast(message, isError = false, duration = 6000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.warn('Toast container not found');
      alert(message);
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

  function handleServerResponse(data, defaultSuccessMessage) {
    if (typeof data === 'string') {
      showToast(defaultSuccessMessage || 'Thank you!', false);
      return;
    }

    if (data.success === true) {
      const message = data.message || defaultSuccessMessage || 'Thank you!';
      showToast(message, false);
    } else if (data.success === false) {
      const errorMessage = data.message || 'Something went wrong. Please try again.';
      showToast(errorMessage, true);
    } else {
      const message = data.message || defaultSuccessMessage || 'Thank you!';
      showToast(message, false);
    }
  }

  /* ========= ИНИЦИАЛИЗАЦИЯ ОДНОЙ ФОРМЫ ========= */

  function initAAForm(container) {
    if (!container) return;

    // защита от повторной инициализации (важно для Webflow + Ajax/модалок)
    if (container.dataset.aaInitialized === 'true') {
      console.log('AA form already initialized, skip:', container);
      return;
    }
    container.dataset.aaInitialized = 'true';

    const formType  = (container.dataset.formType || 'generic').toLowerCase();
    const webhookUrl = container.dataset.webhook || '';

    if (!webhookUrl) {
      console.error('AA form is missing data-webhook attribute:', container);
      return;
    }

    const formId    = container.dataset.formId || null;
    const source    = container.dataset.source || formType;
    const productId = container.dataset.productId || null;

    // если чекбокса нет — не требуем согласия
    const checkboxContainer = container.querySelector('.checkbox-container');
    const requireConsent    = checkboxContainer
      ? container.dataset.requireConsent === 'false'
        ? false
        : true
      : false;

    // поля: .field[data-field="name|email|message|..."]
    const fieldWrappers = container.querySelectorAll('.field[data-field]');
    const fieldsConfig = {}; // fieldName -> { wrapper, input, required }

    fieldWrappers.forEach((fieldEl) => {
      const input = fieldEl.querySelector('.input');
      if (!input) return;

      const fieldNameRaw = fieldEl.dataset.field || '';
      if (!fieldNameRaw) return;

      const fieldName = fieldNameRaw.trim();
      const requiredAttr = fieldEl.dataset.required;
      const required = requiredAttr === 'false' ? false : true;

      fieldsConfig[fieldName] = {
        name: fieldName,
        wrapper: fieldEl,
        input,
        required,
      };
    });

    const checkbox      = container.querySelector('.form-checkbox, #agreementCheckbox');
    const checkboxError = container.querySelector('.checkbox-error');

    const submitButton =
      container.querySelector('[data-aa-submit]') ||
      container.querySelector('.submit-button');

    if (!submitButton) {
      console.warn('Submit button not found in AA form', container);
      return;
    }

    const originalButtonText = submitButton.textContent.trim() || 'Submit';
    const loadingTextAttr    = submitButton.dataset.loadingText;

    let defaultLoadingText = 'Sending...';
    if (formType === 'newsletter') defaultLoadingText = 'Subscribing...';

    const loadingText = loadingTextAttr || defaultLoadingText;

    let isChecked = false;

    /* ====== helpers: ошибки / лейблы ====== */

    function updateLabel(fieldEl) {
      if (!fieldEl) return;
      const input = fieldEl.querySelector('.input');
      const label = fieldEl.querySelector('.floating-label');
      if (!input || !label) return;

      const isFocused = input === document.activeElement;
      const hasValue  = input.value.trim() !== '';

      if (isFocused || hasValue) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    }

    function showFieldError(fieldName, message) {
      const field = fieldsConfig[fieldName];
      if (!field) return;

      const fieldEl      = field.wrapper;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input        = field.input;

      if (errorMessage && input) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        input.classList.add('error');
      }
    }

    function hideFieldError(fieldName) {
      const field = fieldsConfig[fieldName];
      if (!field) return;

      const fieldEl      = field.wrapper;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input        = field.input;

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

    /* ====== валидация ====== */

    function validateField(fieldName) {
      const field = fieldsConfig[fieldName];
      if (!field) return true;

      const value    = field.input.value.trim();
      const required = field.required;
      const key      = fieldName.toLowerCase();

      if (!required && !value) {
        hideFieldError(fieldName);
        return true;
      }

      if (key === 'email') {
        if (!value) {
          showFieldError(fieldName, 'Email is required');
          return false;
        }
        if (!isValidEmail(value)) {
          showFieldError(fieldName, 'Enter a valid email address');
          return false;
        }
        hideFieldError(fieldName);
        return true;
      }

      if (key === 'name') {
        if (!value) {
          showFieldError(fieldName, 'Name is required');
          return false;
        }
        if (!isValidName(value)) {
          showFieldError(fieldName, 'Name must be at least 2 characters');
          return false;
        }
        hideFieldError(fieldName);
        return true;
      }

      if (key === 'message') {
        if (!value && required) {
          showFieldError(fieldName, 'Message is required');
          return false;
        }
        if (value && !isValidMessage(value)) {
          showFieldError(fieldName, 'Message must be at least 10 characters');
          return false;
        }
        hideFieldError(fieldName);
        return true;
      }

      if (required && !value) {
        showFieldError(fieldName, 'This field is required');
        return false;
      }

      hideFieldError(fieldName);
      return true;
    }

    function validateForm() {
      let isValid = true;

      Object.keys(fieldsConfig).forEach((fieldName) => {
        if (!validateField(fieldName)) {
          isValid = false;
        }
      });

      if (checkboxContainer && requireConsent) {
        if (!isChecked) {
          showCheckboxError(
            'Please agree to the Terms and Conditions and Privacy Policy'
          );
          isValid = false;
        } else {
          hideCheckboxError();
        }
      }

      return isValid;
    }

    /* ====== сбор данных ====== */

    function collectFieldValues() {
      const values = {};
      Object.keys(fieldsConfig).forEach((fieldName) => {
        values[fieldName] = fieldsConfig[fieldName].input.value.trim();
      });
      return values;
    }

    /* ====== сброс формы ====== */

    function resetForm() {
      Object.keys(fieldsConfig).forEach((fieldName) => {
        const field = fieldsConfig[fieldName];
        field.input.value = '';
        hideFieldError(fieldName);
        updateLabel(field.wrapper);
      });

      isChecked = false;
      if (checkbox) {
        checkbox.classList.remove('checked');
      }

      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }

    /* ====== отправка ====== */

    function submitFormData(payload, defaultSuccessMessage) {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      return fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              return response.json();
            } else {
              return response
                .text()
                .then((text) => ({ success: true, message: text }));
            }
          } else {
            throw new Error(
              `Server error: ${response.status} ${response.statusText}`
            );
          }
        })
        .then((data) => {
          console.log('Success:', data);
          handleServerResponse(data, defaultSuccessMessage);
          resetForm();
        })
        .catch((error) => {
          console.error('Error:', error);

          let errorMessage = 'Something went wrong. Please try again.';

          if (error.name === 'AbortError') {
            errorMessage =
              'Request timed out. Please check your connection and try again.';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage =
              'Network error. Please check your internet connection.';
          } else if (error.message.includes('Server error')) {
            errorMessage =
              'Server is temporarily unavailable. Please try again later.';
          }

          showToast(errorMessage, true);

          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
    }

    /* ====== инициализация полей ====== */

    Object.keys(fieldsConfig).forEach((fieldName) => {
      const field   = fieldsConfig[fieldName];
      const fieldEl = field.wrapper;
      const input   = field.input;

      input.addEventListener('focus', function () {
        updateLabel(fieldEl);
      });

      input.addEventListener('blur', function () {
        updateLabel(fieldEl);
        if (input.value.trim()) {
          validateField(fieldName);
        }
      });

      input.addEventListener('input', function () {
        updateLabel(fieldEl);
        hideFieldError(fieldName);
      });

      updateLabel(fieldEl);
    });

    /* ====== чекбокс ====== */

    if (checkbox && checkboxContainer) {
      checkboxContainer.addEventListener('click', function (e) {
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

    /* ====== клик по submit ====== */

    submitButton.addEventListener('click', function (e) {
      e.preventDefault();

      if (!validateForm()) {
        console.log('AA form validation failed');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = loadingText;

      const values = collectFieldValues();

      const payload = {
        formType,
        formId,
        source,
        timestamp: new Date().toISOString(),
        agreedToTerms: !!isChecked,
        productId: productId || null,
        name:    values.name    || '',
        email:   values.email   || '',
        message: values.message || '',
      };

      let defaultSuccessMessage = 'Thank you!';
      if (formType === 'newsletter') {
        defaultSuccessMessage =
          'Thank you for subscribing! Check your email for confirmation.';
      } else if (
        formType === 'contact' ||
        formType === 'product-inquiry'
      ) {
        defaultSuccessMessage = 'Thank you! Your message has been sent.';
      }

      console.log('AA form payload:', payload);

      submitFormData(payload, defaultSuccessMessage);
    });

    console.log('AA form initialized:', { formType, formId, webhookUrl });
  }

  /* ========= ИНИЦИАЛИЗАЦИЯ ВСЕХ ФОРМ ========= */

  function initAllAAForms() {
    const containers = document.querySelectorAll('[data-aa-form]');
    if (!containers.length) {
      console.log('No AA forms found');
      return;
    }
    containers.forEach(initAAForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllAAForms);
  } else {
    initAllAAForms();
  }
})();
