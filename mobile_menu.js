document.addEventListener('DOMContentLoaded', () => {
  /* =========  DOM-элементы  ========= */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');   // логотип
  const overlay    = mobileMenu.querySelector('.menu-overlay');   // контейнер
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');     // белый овал

  /* =========  флаги-помощники  ========= */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* =========  константы  ========= */
  const DRAG_THRESHOLD = 10;     // до 10 px считаем «тап»
  const UP_THRESHOLD   = -70;    // подняли выше 70 px → открыть чат
  const MAX_UP         = -100;   // выше не тянем
  const DOWN_LIMIT     =  40;    // вниз максимум 40 px
  const DAMP           =  0.3;   // «вязкость» за пределом
  const SPRING         = 'transform .3s cubic-bezier(.16,1,.3,1)';
  const BG_TRANSITION  = 'transform .45s ease';

  /* =========  утилиты  ========= */
  const clampViscous = (dy, limit, sign) => {
    const over = sign > 0 ? dy - limit : limit - dy;
    return sign > 0
      ? limit + over * DAMP
      : limit - over * DAMP;
  };

  /* =========  базовые режимы  ========= */
  function reset() {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    trigger  .style.transition = '';
    overlayBg.style.transition = '';
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = '';
    document.body.style.overflow = '';
  }

  function openMenu() {
    overlayBg.style.transition = BG_TRANSITION; // вернём плавность масштаба
    overlayBg.style.transform  = '';            // убираем inline-shift
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlayBg.style.transition = BG_TRANSITION;
    overlay.classList.remove('open');
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';
    document.body.style.overflow = '';
  }

  function openChat() {            // открываем чат «поверх» меню
    openMenu();                    // овал раскрывается той же анимацией
    mobileMenu.classList.add('chat-open');
  }

  function closeChat() {
    mobileMenu.classList.remove('chat-open');
    closeMenu();                   // фон складывается той же анимацией
  }

  /* =========  начальный сброс + bfcache  ========= */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* =========  CLICK (тап)  ========= */
  let dragged = false;             // чтобы клик не срабатывал после drag
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }

    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* =========  DRAG-жест  ========= */
  let startY = null, deltaY = 0;
  let rafId  = null;

  trigger.addEventListener('pointerdown', e => {
    startY  = e.clientY;
    deltaY  = 0;
    trigger  .style.transition = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e => {
    if (startY === null) return;

    deltaY = e.clientY - startY;
    const abs = Math.abs(deltaY);

    /* если превысили 10 px — это drag, блокируем скролл */
    if (abs > DRAG_THRESHOLD) {
      dragged = true;
      e.preventDefault();
    }

    /* «вязкие» пределы */
    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = clampViscous(deltaY, DOWN_LIMIT, +1);
    if (deltaY <  MAX_UP)     eff = clampViscous(deltaY, MAX_UP,   -1);

    /* обновляем transform через requestAnimationFrame */
    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        trigger  .style.transform = `translate(-50%, ${eff}px)`;
        overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
        rafId = null;
      });
    }
  }, { passive:false });

  window.addEventListener('pointerup', () => {
    if (startY === null) return;

    /* «отпрыгиваем» назад */
    trigger  .style.transition = SPRING;
    overlayBg.style.transition = SPRING;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    /* если подняли достаточно — открыть чат */
    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    startY = null;
  });
});
