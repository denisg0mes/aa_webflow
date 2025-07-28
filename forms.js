// Состояние формы
        let isChecked = false;

        // Элементы
        const customCheckbox = document.getElementById('customCheckbox');
        const checkboxContainer = document.getElementById('checkboxContainer');
        const submitButton = document.getElementById('submitButton');
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const form = document.getElementById('newsletterForm');
        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const formNotification = document.getElementById('formNotification');

        // Валидация имени (минимум 2 символа)
        function isValidName(name) {
            return name.trim().length >= 2;
        }

        // Валидация email
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Показать уведомление
        function showNotification(message, isSuccess = false) {
            formNotification.textContent = message;
            formNotification.className = isSuccess ? 'form-notification success' : 'form-notification';
            formNotification.style.display = 'block';
            
            // Скрываем через 5 секунд
            setTimeout(() => {
                formNotification.style.display = 'none';
            }, 5000);
        }

        // Очистка всех ошибок
        function clearErrors() {
            nameError.style.display = 'none';
            emailError.style.display = 'none';
            formNotification.style.display = 'none';
            nameInput.classList.remove('error');
            emailInput.classList.remove('error');
        }

        // Обработчик клика по чекбоксу
        checkboxContainer.addEventListener('click', function(e) {
            // Не активируем чекбокс если клик по ссылке
            if (e.target.tagName === 'A') {
                return;
            }

            isChecked = !isChecked;
            customCheckbox.classList.toggle('checked', isChecked);
        });

        // Очистка ошибок при начале ввода
        nameInput.addEventListener('input', function() {
            if (nameError.style.display === 'block') {
                nameError.style.display = 'none';
                this.classList.remove('error');
            }
            if (formNotification.style.display === 'block') {
                formNotification.style.display = 'none';
            }
        });

        emailInput.addEventListener('input', function() {
            if (emailError.style.display === 'block') {
                emailError.style.display = 'none';
                this.classList.remove('error');
            }
            if (formNotification.style.display === 'block') {
                formNotification.style.display = 'none';
            }
        });

        // Обработка отправки формы
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log('Form submitted'); // Отладка
            
            // Очищаем предыдущие ошибки
            clearErrors();
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            let hasErrors = false;

            console.log('Name:', name, 'Email:', email, 'Checked:', isChecked); // Отладка

            // Валидация имени
            if (!name) {
                console.log('Name error: empty'); // Отладка
                nameError.textContent = 'Enter your name';
                nameError.style.display = 'block';
                nameError.style.color = '#ff4444';
                nameInput.classList.add('error');
                hasErrors = true;
            } else if (!isValidName(name)) {
                console.log('Name error: too short'); // Отладка
                nameError.textContent = 'Name must be at least 2 characters';
                nameError.style.display = 'block';
                nameError.style.color = '#ff4444';
                nameInput.classList.add('error');
                hasErrors = true;
            }

            // Валидация email
            if (!email) {
                console.log('Email error: empty'); // Отладка
                emailError.textContent = 'Enter your email';
                emailError.style.display = 'block';
                emailError.style.color = '#ff4444';
                emailInput.classList.add('error');
                hasErrors = true;
            } else if (!isValidEmail(email)) {
                console.log('Email error: invalid'); // Отладка
                emailError.textContent = 'Enter a valid email address';
                emailError.style.display = 'block';
                emailError.style.color = '#ff4444';
                emailInput.classList.add('error');
                hasErrors = true;
            }

            // Проверка чекбокса
            if (!isChecked) {
                console.log('Checkbox error'); // Отладка
                showNotification('Please agree to the Terms and Conditions and Privacy Policy');
                hasErrors = true;
            }

            console.log('Has errors:', hasErrors); // Отладка

            // Если есть ошибки - останавливаемся
            if (hasErrors) {
                return;
            }

            // Имитация отправки
            submitButton.textContent = 'Subscribing...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                // Успешная отправка
                showNotification('Thank you for subscribing! Check your email.', true);
                
                // Очищаем форму
                nameInput.value = '';
                emailInput.value = '';
                isChecked = false;
                customCheckbox.classList.remove('checked');
                
                // Восстанавливаем кнопку
                submitButton.textContent = 'Subscribe';
                submitButton.disabled = false;
                
                // Здесь можно добавить реальную отправку данных
                console.log('Отправка данных:', { name, email });
                
            }, 1500);
        });
