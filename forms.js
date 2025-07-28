const emailInput = document.getElementById('emailInput');
const floatingLabel = document.getElementById('floatingLabel');

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

// События для отслеживания состояния поля
emailInput.addEventListener('focus', function() {
    console.log('Focus event');
    updateLabel();
});

emailInput.addEventListener('blur', function() {
    console.log('Blur event');
    updateLabel();
});

emailInput.addEventListener('input', function() {
    console.log('Input event, value:', this.value);
    updateLabel();
});

// Инициализация
updateLabel();
