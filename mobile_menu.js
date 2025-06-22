document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');
  const links   = overlay.querySelector('.menu-container');

  // Скрываем меню сразу, без анимаций
  function resetMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    links.style.transition     = 'none';
    links.style.opacity        = '0';
    links.style.transform      = 'translateY(20px)';
    links.style.pointerEvents  = 'none';
  }

  // Первый сброс при загрузке
  resetMenu();

  // Ещё сброс, если страница восстановлена из bfcache
  window.addEventListener('pageshow', event => {
    if (event.persisted) resetMenu();
  });

  function openMenu() {
    // чистим «none»-transition, чтобы дальше всё шло по CSS
    links.style.transition    = '';
    links.style.pointerEvents = '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    // прячем пункты с анимацией
    links.style.transition    = 'opacity .2s ease, transform .2s ease';
    links.style.opacity       = '0';
    links.style.transform     = 'translateY(20px)';
    links.style.pointerEvents = 'none';
    // сразу же сворачиваем фон
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });
});
