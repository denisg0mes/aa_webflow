document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');
  const links   = overlay.querySelector('.menu-container');

  function openMenu() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // вернём пункты в исходное состояние (на случай повторных открытий)
    links.style.transition = '';
    links.style.opacity = '';
    links.style.transform = '';
    links.style.pointerEvents = '';
  }

  function closeMenu() {
    // 1) Прячем пункты меню мгновенно
    links.style.transition = 'opacity .2s ease, transform .2s ease';
    links.style.opacity = '0';
    links.style.transform = 'translateY(20px)';
    links.style.pointerEvents = 'none';
    // 2) Сразу же сворачиваем фон
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });

  overlay.querySelectorAll('.menu-container a').forEach(link =>
    link.addEventListener('click', closeMenu)
  );
});
