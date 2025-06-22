document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');
  const links   = overlay.querySelector('.menu-links');

  function openMenu() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // пункты покажутся по CSS-задержке
  }

  function closeMenu() {
    // 1. Сразу прячем пункты
    links.style.opacity = 0;
    links.style.transform = 'translateY(20px)';
    links.style.pointerEvents = 'none';

    // 2. Через 250мс (равно длительности transition-скрытия) сворачиваем фон
    setTimeout(() => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      // сброс inline-стилей, чтобы пункты снова были готовы к следующему открытию
      links.style.opacity = '';
      links.style.transform = '';
      links.style.pointerEvents = '';
    }, 250);
  }

  trigger.addEventListener('click', () => {
    if (!overlay.classList.contains('open')) openMenu();
    else closeMenu();
  });

  overlay.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', closeMenu)
  );
});
