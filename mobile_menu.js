document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');

  // Сбрасываем меню в закрытое состояние (без анимаций)
  function resetMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // При первой загрузке
  resetMenu();

  // При возврате через кнопку «Назад» (bfcache)
  window.addEventListener('pageshow', event => {
    if (event.persisted) resetMenu();
  });

  // Открыть/закрыть по клику на логотип
  trigger.addEventListener('click', () => {
    const isOpen = overlay.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
});
