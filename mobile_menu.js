document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');
  const links   = overlay.querySelector('.menu-container');

  // Функция сброса меню
  function resetMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    links.style.transition = '';
    links.style.opacity = '';
    links.style.transform = '';
    links.style.pointerEvents = '';
  }

  // Сброс при первой загрузке
  resetMenu();

  // Сброс при возврате из bfcache
  window.addEventListener('pageshow', event => {
    if (event.persisted) resetMenu();
  });

  function openMenu() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    links.style.transition = '';
    links.style.opacity = '';
    links.style.transform = '';
    links.style.pointerEvents = '';
  }

  function closeMenu() {
    links.style.transition = 'opacity .2s ease, transform .2s ease';
    links.style.opacity = '0';
    links.style.transform = 'translateY(20px)';
    links.style.pointerEvents = 'none';
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });
});
