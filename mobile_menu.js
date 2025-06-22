document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');

  // Убираем меню при загрузке или при возврате назад
  function resetMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  resetMenu();
  window.addEventListener('pageshow', event => {
    if (event.persisted) resetMenu();
  });

  // По клику на лого-триггер просто переключаем класс open
  trigger.addEventListener('click', () => {
    const isOpen = overlay.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
});
