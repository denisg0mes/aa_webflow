document.addEventListener('DOMContentLoaded', () => {

  /* =============== базовые ссылки =============== */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');

  /* =========== настройки / пороги =========== */
  const DRAG_THRESHOLD = 10;       // до 10 px – считаем «тап»
  const UP_THRESHOLD   = -70;      // выше 70 px – открыть чат
  const MAX_UP         = -100;     // физ. предел вверх
  const DOWN_LIMIT     =  40;      // физ. предел вниз
  const DAMP           =  0.3;     // «вязкость» вне лимитов
  const MENU_FADE      = 250;      // мс – скрытие пунктов
  const BG_TRANS       = 450;      // мс – масштаб овала
  const SPRING         = 'transform .3s cubic-bezier(.16,1,.3,1)';
  const BG_EASE        = 'transform .45s ease';

  /* =========== утилиты-флаги =========== */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');
  const damp = (dy, lim, sign) => {
    const over = sign > 0 ? dy - lim : lim - dy;
    return sign > 0 ? lim + over * DAMP : lim - over * DAMP;
  };

  /* =========== базовые режимы =========== */
  function reset() {
    overlay.classList.remove('open','closing');
    mobileMenu.classList.remove('chat-open');
    overlayBg.style.transition = '';
    overlayBg.style.transform  = '';
    trigger  .style.transition = '';
    trigger  .style.transform  = 'translate(-50%,0)';
    document.body.style.overflow = '';
  }

  function openMenu() {
    overlayBg.style.transition = BG_EASE;
    overlayBg.style.transform  = '';              // CSS scale(20) сработает
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!isMenuOpen()) return;

    /* 1 – моментально скрываем пункты */
    overlay.classList.add('closing');             // просто флаг, если понадобится

    /* 2 – через 250 мс сворачиваем фон */
    setTimeout(() => {
      overlayBg.style.transition = BG_EASE;
      overlay.classList.remove('open');
      overlayBg.style.transform  = 'translate(-50%,0) scale(1)';
      /* 3 – после завершения масштаба убираем вспомогательный класс */
      setTimeout(() => overlay.classList.remove('closing'), BG_TRANS);
    }, MENU_FADE);

    document.body.style.overflow = '';
  }

  function openChat() {
    /* сначала раскрываем фон той же анимацией, потом показываем чат-контейнер */
    openMenu();
    mobileMenu.classList.add('chat-open');
  }

  const closeChat = () => { mobileMenu.classList.remove('chat-open'); closeMenu(); };

  /* =========== init + bfcache =========== */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* =========== CLICK =========== */
  let dragged = false;
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }
    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* =========== DRAG-&-DROP =========== */
  let startY=null, deltaY=0, raf=null;

  trigger.addEventListener('pointerdown', e => {
    startY = e.clientY;
    deltaY = 0;
    trigger  .style.transition = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e => {
    if (startY===null) return;
    deltaY = e.clientY - startY;

    const abs = Math.abs(deltaY);
    if (abs > DRAG_THRESHOLD) { dragged = true; e.preventDefault(); }

    /* вязкость и клампы */
    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = damp(deltaY, DOWN_LIMIT, +1);
    if (deltaY <  MAX_UP)     eff = damp(deltaY, MAX_UP,   -1);

    if (!raf) raf = requestAnimationFrame(()=>{
      trigger  .style.transform = `translate(-50%, ${eff}px)`;
      overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
      raf = null;
    });
  }, {passive:false});

  window.addEventListener('pointerup', () => {
    if (startY===null) return;

    trigger  .style.transition = SPRING;
    overlayBg.style.transition = SPRING;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    startY=null;
  });

});
