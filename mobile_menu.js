document.addEventListener('DOMContentLoaded', () => {
  const mobileMenu = document.querySelector('.mobile-menu');   // обёртка-компонент
  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');

  /* ---------- helpers ---------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  function reset() {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = '';
  }

  /* начальный сброс + bfcache */
  reset();
  window.addEventListener('pageshow', e => e.persisted && reset());

  /* ------- режимы ------- */
  function openMenu()  {
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openChat() {
    mobileMenu.classList.add('chat-open');
    overlay.classList.add('open');          // блокируем фон + скролл
    document.body.style.overflow = 'hidden';
  }

  function closeChat() {
    mobileMenu.classList.remove('chat-open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ------- клик по логотипу ------- */
  trigger.addEventListener('click', () => {
    if (isChatOpen())      closeChat();     // если открыт чат — закрываем чат
    else if (isMenuOpen()) closeMenu();     // если открыто меню — сворачиваем меню
    else                   openMenu();      // иначе открываем меню
  });

  /* ------- жест «протяни вверх» для чата ------- */
  let startY = null;
  trigger.addEventListener('pointerdown', e => { startY = e.clientY; });
  window.addEventListener('pointermove', e => {
    if (startY === null) return;
    if (e.clientY - startY < -80 && !isChatOpen()) { // сдвиг вверх >80px
      openChat();
      startY = null;                               // сброс
    }
  });
  window.addEventListener('pointerup', () => { startY = null; });
});
