<script>
document.addEventListener('DOMContentLoaded', () => {
  /* ---------- базовые ссылки на элементы ---------- */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;                     // компонент отсутствует
  const trigger = mobileMenu.querySelector('.menu-trigger');
  const overlay = mobileMenu.querySelector('.menu-overlay');

  /* ---------- вспомогательные флаги ---------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* ---------- функции состояния ---------- */
  function reset() {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = '';
  }

  function openMenu() {
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openChat() {
    mobileMenu.classList.add('chat-open');   // показ chat-контейнера
    overlay.classList.add('open');           // фон + блок скролла
    document.body.style.overflow = 'hidden';
  }

  function closeChat() {
    mobileMenu.classList.remove('chat-open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- инициализация & bfcache ---------- */
  reset();                                   // при первой загрузке
  window.addEventListener('pageshow', e => { // при «Назад» из bfcache
    if (e.persisted) reset();
  });

  /* ---------- клик по логотипу ---------- */
  trigger.addEventListener('click', () => {
    if (isChatOpen())       { closeChat(); }
    else if (isMenuOpen())  { closeMenu(); }
    else                    { openMenu();  }
  });

  /* ---------- жест «свайп вверх» ---------- */
  let startY = null;

  // запоминаем точку старта
  trigger.addEventListener('pointerdown', e => { startY = e.clientY; });

  // отслеживаем движение
  window.addEventListener('pointermove', e => {
    if (startY === null) return;
    e.preventDefault();                      // блокируем прокрутку
    const deltaY = e.clientY - startY;
    if (deltaY < -40 && !isChatOpen()) {     // тянем вверх > 40 px
      openChat();
      startY = null;                         // сброс
    }
  }, { passive: false });                    // обязателен!

  // отпуск пальца → сбросим старт
  window.addEventListener('pointerup', () => { startY = null; });
});
</script>
