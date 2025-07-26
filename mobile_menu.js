document.addEventListener('DOMContentLoaded', () => {
  /* ---------- базовые элементы ---------- */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');

  /* ---------- полезные проверки ---------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* ---------- лимиты и пороги ---------- */
  const DRAG_THRESHOLD = 10;   // «микро-движения» игнорируем
  const UP_THRESHOLD   = -70;  // > 70 px вверх → чат
  const MAX_UP         = -100; // больше не тянем
  const DOWN_LIMIT     =  40;  // вниз максимум 40
  const DAMP           =  0.3; // вязкость за пределами

  /* ---------- утилиты ---------- */
  const damp = (dy, limit, sign) => {
    const over = sign > 0 ? dy - limit : limit - dy;
    return sign > 0
      ? limit + over * DAMP
      : limit - over * DAMP;
  };

  /* ---------- функции состояний ---------- */
  function reset() {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    overlayBg.style.transform = '';
    overlayBg.style.transition = '';
    trigger.style.transform = 'translate(-50%,0)';
    trigger.style.transition = '';
    document.body.style.overflow = '';
  }

  const openMenu  = () => {
    overlayBg.style.transform  = '';   // снять inline
    overlayBg.style.transition = '';
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    overlay.classList.remove('open');
    overlayBg.style.transition = 'transform .45s ease';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';
    document.body.style.overflow = '';
  };

  const openChat  = () => {
    mobileMenu.classList.add('chat-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeChat = () => {
    mobileMenu.classList.remove('chat-open');
    closeMenu();
  };

  /* ---------- инициализация & bfcache ---------- */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* ---------- Click ---------- */
  let dragged = false;
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }   // игнор «клика после drag»
    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* ---------- Drag ---------- */
  let startY = null, deltaY = 0;

  trigger.addEventListener('pointerdown', e => {
    startY  = e.clientY;
    deltaY  = 0;
    dragged = false;
    trigger.style.transition   = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e => {
    if (startY === null) return;

    deltaY = e.clientY - startY;
    const absDY = Math.abs(deltaY);

    /* блокируем скролл и отмечаем drag только, когда перешли порог */
    if (absDY > DRAG_THRESHOLD) {
      dragged = true;
      e.preventDefault();
    }

    /* визуальный эффект даже при мелких движениях */
    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = damp(deltaY, DOWN_LIMIT, +1);
    if (deltaY <  MAX_UP)     eff = damp(deltaY, MAX_UP,     -1);

    trigger  .style.transform = `translate(-50%, ${eff}px)`;
    overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
  }, { passive:false });

  window.addEventListener('pointerup', () => {
    if (startY === null) return;

    /* возвращаем «пружину» */
    const spring = 'transform .3s cubic-bezier(.16,1,.3,1)';
    trigger  .style.transition = spring;
    overlayBg.style.transition = spring;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    /* открываем чат, если протянули достаточно высоко */
    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    startY = null;
  });
});
