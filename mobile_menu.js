document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.querySelector('.mobile-menu');
  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');

  // Сброс в закрытое состояние (без анимаций)
  function resetMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // При первой загрузке
  resetMenu();

  // При возврате «Назад» из bfcache
  window.addEventListener('pageshow', event => {
    if (event.persisted) resetMenu();
  });

  // Открыть/закрыть по клику внутри этого компонента
  trigger.addEventListener('click', () => {
    const isOpen = overlay.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
});
