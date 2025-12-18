(function () {
  /* ========= ATTRIBUTION + PATH TRACKING ========= */

  const AA_STORAGE_KEYS = {
    firstTouch: 'aa_first_touch',
    lastTouch: 'aa_last_touch',
    path: 'aa_path',
    sessionId: 'aa_session_id',
  };

  function aaNowISO() {
    return new Date().toISOString();
  }

  function aaSafeParseJSON(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  }

  function aaGetSessionId() {
    let sid = localStorage.getItem(AA_STORAGE_KEYS.sessionId);
    if (!sid) {
      sid =
        'sid_' +
        Math.random().toString(16).slice(2) +
        '_' +
        Date.now().toString(16);
      localStorage.setItem(AA_STORAGE_KEYS.sessionId, sid);
    }
    return sid;
  }

  function aaGetQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
  }

  function aaGetUTM() {
    return {
      utm_source: aaGetQueryParam('utm_source'),
      utm_medium: aaGetQueryParam('utm_medium'),
      utm_campaign: aaGetQueryParam('utm_campaign'),
      utm_content: aaGetQueryParam('utm_content'),
      utm_term: aaGetQueryParam('utm_term'),
    };
  }

  function aaGetClickIds() {
    return {
      gclid: aaGetQueryParam('gclid'),
      wbraid: aaGetQueryParam('wbraid'),
      gbraid: aaGetQueryParam('gbraid'),
      fbclid: aaGetQueryParam('fbclid'),
    };
  }

  function aaGetReferrer() {
    return document.referrer || '';
  }

  function aaGetPageLocation() {
    return window.location.href;
  }

  function aaGetPagePath() {
    return window.location.pathname + window.location.search;
  }

  function aaHasAnyAttribution(utm, clickIds, referrer) {
    const utmHas = Object.keys(utm).some((k) => !!utm[k]);
    const clickHas = Object.keys(clickIds).some((k) => !!clickIds[k]);
    const refHas = !!referrer;
    return utmHas || clickHas || refHas;
  }

  function aaSaveAttribution() {
    const utm = aaGetUTM();
    const clickIds = aaGetClickIds();
    const referrer = aaGetReferrer();

    const payload = {
      ts: aaNowISO(),
      page_location: aaGetPageLocation(),
      page_path: aaGetPagePath(),
      referrer,
      utm,
      click_ids: clickIds,
    };

    const existingFirst = aaSafeParseJSON(
      localStorage.getItem(AA_STORAGE_KEYS.firstTouch)
    );

    if (!existingFirst && aaHasAnyAttribution(utm, clickIds, referrer)) {
      localStorage.setItem(AA_STORAGE_KEYS.firstTouch, JSON.stringify(payload));
    }

    if (aaHasAnyAttribution(utm, clickIds, referrer)) {
      localStorage.setItem(AA_STORAGE_KEYS.lastTouch, JSON.stringify(payload));
    } else {
      const existingLast = aaSafeParseJSON(
        localStorage.getItem(AA_STORAGE_KEYS.lastTouch)
      );
      if (!existingLast) {
        localStorage.setItem(AA_STORAGE_KEYS.lastTouch, JSON.stringify(payload));
      }
    }
  }

  function aaTrackPath() {
    const entry = {
      ts: aaNowISO(),
      page_location: aaGetPageLocation(),
      page_path: aaGetPagePath(),
    };

    let arr = aaSafeParseJSON(localStorage.getItem(AA_STORAGE_KEYS.path));
    if (!Array.isArray(arr)) arr = [];

    const last = arr[arr.length - 1];
    if (!last || last.page_location !== entry.page_location) {
      arr.push(entry);
      if (arr.length > 25) arr = arr.slice(arr.length - 25);
      localStorage.setItem(AA_STORAGE_KEYS.path, JSON.stringify(arr));
    }
  }

  function aaGetAttributionBundle() {
    let first = aaSafeParseJSON(localStorage.getItem(AA_STORAGE_KEYS.firstTouch));
    let last = aaSafeParseJSON(localStorage.getItem(AA_STORAGE_KEYS.lastTouch));
    let path = aaSafeParseJSON(localStorage.getItem(AA_STORAGE_KEYS.path));

    if (!first) {
      first = {
        ts: aaNowISO(),
        page_location: aaGetPageLocation(),
        page_path: aaGetPagePath(),
        referrer: aaGetReferrer(),
        utm: aaGetUTM(),
        click_ids: aaGetClickIds(),
      };
    }

    if (!last) last = first;
    if (!Array.isArray(path)) path = [];

    return {
      session_id: aaGetSessionId(),
      first_touch: first,
      last_touch: last,
      path,
    };
  }

  function aaFireGAEvent(eventName, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  /* ========= META PIXEL HELPERS ========= */

  function aaMakeMetaEventId(prefix, sessionId) {
    const safePrefix = typeof prefix === 'string' && prefix ? prefix : 'aa';
    const sid = typeof sessionId === 'string' && sessionId ? sessionId : 'nosid';
    return safePrefix + '_' + sid + '_' + Date.now().toString(16);
  }

  function aaFireMetaEvent(eventName, params, options) {
    if (typeof window.fbq !== 'function') return;

    const evName = typeof eventName === 'string' ? eventName : '';
    if (!evName) return;

    const evParams = params && typeof params === 'object' ? params : {};
    const evOptions = options && typeof options === 'object' ? options : undefined;

    try {
      if (evOptions) {
        window.fbq('track', evName, evParams, evOptions);
      } else {
        window.fbq('track', evName, evParams);
      }
    } catch (e) {
      console.warn('Meta Pixel track error:', e);
    }
  }

  // capture attribution + path on every page load
  aaSaveAttribution();
  aaTrackPath();

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

  /**
   * Обработка ответа от сервера:
   * - возвращает true, если считаем кейс успешным (можно ресетить форму)
   * - возвращает false, если считаем кейс неуспешным (оставляем данные в форме)
   */
  function handleServerResponse(data) {
    const defaultSuccess = 'Thank you!';
    const defaultError = 'Something went wrong. Please try again.';

    if (typeof data === 'string') {
      const message = data.trim() || defaultSuccess;
      showToast(message, false);
      return true;
    }

    if (data && data.success === false) {
      const message =
        (typeof data.message === 'string' && data.message.trim()) ||
        defaultError;
      showToast(message, true);
      return false;
    }

    if (data && data.success === true) {
      const message =
        (typeof data.message === 'string' && data.message.trim()) ||
        defaultSuccess;
      showToast(message, false);
      return true;
    }

    if (data && typeof data.message === 'string' && data.message.trim()) {
      showToast(data.message.trim(), false);
      return true;
    }

    showToast(defaultSuccess, false);
    return true;
  }

  /* ========= ИНИЦИАЛИЗАЦИЯ ОДНОЙ ФОРМЫ ========= */

  function initAAForm(container) {
    if (!container) return;

    if (container.dataset.aaInitialized === 'true') {
      console.log('AA form already initialized, skip:', container);
      return;
    }
    container.dataset.aaInitialized = 'true';

    const formType = (container.dataset.formType || 'generic').toLowerCase();
    const webhookUrl = container.dataset.webhook || '';

    if (!webhookUrl) {
      console.error('AA form is missing data-webhook attribute:', container);
      return;
    }

    const formId = container.dataset.formId || null;
    const source = container.dataset.source || formType;
    const productId = container.dataset.productId || null;

    const checkboxContainer = container.querySelector('.checkbox-container');
    const requireConsent = checkboxContainer
      ? container.dataset.requireConsent === 'false'
        ? false
        : true
      : false;

    const fieldWrappers = container.querySelectorAll('.field[data-field]');
    const fieldsConfig = {};

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

    const checkbox = container.querySelector(
      '.form-checkbox, #agreementCheckbox'
    );
    const checkboxError = container.querySelector('.checkbox-error');

    const submitButton =
      container.querySelector('[data-aa-submit]') ||
      container.querySelector('.submit-button');

    if (!submitButton) {
      console.warn('Submit button not found in AA form', container);
      return;
    }

    const originalButtonText = submitButton.textContent.trim() || 'Submit';
    const loadingTextAttr = submitButton.dataset.loadingText;

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
      const hasValue = input.value.trim() !== '';

      if (isFocused || hasValue) {
        label.classList.add('active');
      } else {
        label.classList.remove('active');
      }
    }

    function showFieldError(fieldName, message) {
      const field = fieldsConfig[fieldName];
      if (!field) return;

      const fieldEl = field.wrapper;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input = field.input;

      if (errorMessage && input) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        input.classList.add('error');
      }

      // Дополнительно: только для поля message трогаем ближайший .form-background
      if (fieldName.toLowerCase() === 'message') {
        const background = fieldEl.closest('.form-background');
        if (background) {
          background.classList.add('error');
        }
      }
    }

    function hideFieldError(fieldName) {
      const field = fieldsConfig[fieldName];
      if (!field) return;

      const fieldEl = field.wrapper;
      const errorMessage = fieldEl.querySelector('.error-message');
      const input = field.input;

      if (errorMessage && input) {
        errorMessage.classList.remove('show');
        input.classList.remove('error');
      }

      if (fieldName.toLowerCase() === 'message') {
        const background = fieldEl.closest('.form-background');
        if (background) {
          background.classList.remove('error');
        }
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

      const value = field.input.value.trim();
      const required = field.required;
      const key = fieldName.toLowerCase();

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

    function submitFormData(payload, gaMeta) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          const shouldReset = handleServerResponse(data);

          if (shouldReset) {
            // GA4 conversion on success only (no PII)
            if (gaMeta && gaMeta.session_id) {
              aaFireGAEvent('generate_lead', {
                source: gaMeta.source || '',
                form_type: gaMeta.formType || '',
                form_id: gaMeta.formId || '',
                session_id: gaMeta.session_id || '',
                landing_path: gaMeta.landing_path || '',
                page_location: aaGetPageLocation(),
              });
            }

            // Meta Pixel Lead (success only, no PII)
            const metaEventId = aaMakeMetaEventId('aa_lead', gaMeta && gaMeta.session_id ? gaMeta.session_id : '');
            aaFireMetaEvent(
              'Lead',
              {
                source: gaMeta && gaMeta.source ? gaMeta.source : '',
                form_type: gaMeta && gaMeta.formType ? gaMeta.formType : '',
                form_id: gaMeta && gaMeta.formId ? gaMeta.formId : '',
                landing_path: gaMeta && gaMeta.landing_path ? gaMeta.landing_path : '',
                page_location: aaGetPageLocation(),
              },
              { eventID: metaEventId }
            );

            resetForm();
          } else {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
          }
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
      const field = fieldsConfig[fieldName];
      const fieldEl = field.wrapper;
      const input = field.input;

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
      const attribution = aaGetAttributionBundle();

      const payload = {
        formType,
        formId,
        source,
        timestamp: new Date().toISOString(),
        agreedToTerms: !!isChecked,
        productId: productId || null,

        // user fields (only to n8n / Notion)
        name: values.name || '',
        email: values.email || '',
        message: values.message || '',

        // attribution (to n8n / Notion)
        session_id: attribution.session_id,
        first_touch: attribution.first_touch,
        last_touch: attribution.last_touch,
        path: attribution.path,
      };

      // GA metadata (no PII)
      const gaMeta = {
        source,
        formType,
        formId,
        session_id: attribution.session_id,
        landing_path:
          attribution.first_touch && attribution.first_touch.page_path
            ? attribution.first_touch.page_path
            : '',
      };

      console.log('AA form payload:', payload);

      submitFormData(payload, gaMeta);
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
