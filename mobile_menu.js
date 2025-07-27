document.addEventListener('DOMContentLoaded', () => {
  /* === DOM-элементы компонента === */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');   // логотип
  const overlay    = mobileMenu.querySelector('.menu-overlay');   // full-screen слой
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');     // белый овал

  /* === вспомогалки === */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* === константы поведения === */
  const DRAG_THRESHOLD = 10;     /* до 10 px считаем «тап»                        */
  const UP_THRESHOLD   = -70;    /* поднято выше 70 px  → открыть чат            */
  const MAX_UP         = -100;   /* дальше вверх не тянем                        */
  const DOWN_LIMIT     =  40;    /* вниз максимум 40 px                          */
  const DAMP           =  0.3;   /* «вязкость» за пределом                       */
  const SPRING_MS      = 300;    /* длительность пружины логотипа (ms)           */
  const MENU_FADE_MS   = 250;    /* исчезновение пунктов меню (ms)               */
  const BG_MS          = 450;    /* масштаб овала (ms)                           */
  const SPRING         = `transform .${SPRING_MS}ms cubic-bezier(.16,1,.3,1)`;
  const BG_EASE        = `transform .${BG_MS}ms ease`;

  /* --- утилита «вязкое» значение --- */
  const viscous = (dy, lim, sign) => {
    const over = sign > 0 ? dy - lim : lim - dy;
    return sign > 0
      ? lim + over * DAMP
      : lim - over * DAMP;
  };

  /* =========== базовые режимы =========== */

  function reset() {
    overlay.classList.remove('open','closing');
    mobileMenu.classList.remove('chat-open');
    trigger  .style.transition = '';
    overlayBg.style.transition = '';
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = '';
    document.body.style.overflow = '';
  }

  /* — открыть меню — */
  function openMenu() {
    overlayBg.style.transition = BG_EASE;      // вернём плавность масштаба
    overlayBg.style.transform  = '';           // убираем inline-shift
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }

  /* — закрыть меню (сначала пункты, потом овал) — */
  function closeMenu() {
    if (!isMenuOpen()) return;

    /* 1. Скрываем пункты (они исчезнут за MENU_FADE_MS) */
    overlay.classList.add('closing');          // в CSS .closing .menu-container {opacity:0}

    /* 2. После fade пунктов — складываем фон */
    setTimeout(() => {
      overlay.classList.remove('open');        // CSS-масштаб запустится обратно
      overlayBg.style.transition = BG_EASE;
      overlayBg.style.transform  = 'translate(-50%,0) scale(1)';
      document.body.style.overflow = '';

      /* 3. Когда масштаб закончился — убираем helper-класс */
      setTimeout(() => overlay.classList.remove('closing'), BG_MS);
    }, MENU_FADE_MS);
  }

  /* — открыть чат (после полного раскрытия овала) — */
  function openChat() {
    openMenu();                                 // овал раскрывается
    setTimeout(() => mobileMenu.classList.add('chat-open'), BG_MS);
  }

  const closeChat = () => { mobileMenu.classList.remove('chat-open'); closeMenu(); };

  /* =========== init + bfcache =========== */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* =========== CLICK (тап) =========== */
  let dragged = false;                          // блок клика после drag
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }

    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* =========== DRAG-&-DROP =========== */
  let startY=null, deltaY=0, raf=null;

  trigger.addEventListener('pointerdown', e => {
    startY  = e.clientY;
    deltaY  = 0;
    trigger  .style.transition = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e => {
    if (startY===null) return;

    deltaY = e.clientY - startY;
    const abs = Math.abs(deltaY);
    if (abs > DRAG_THRESHOLD) { dragged = true; e.preventDefault(); }

    /* «резиновый» предел */
    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = viscous(deltaY, DOWN_LIMIT, +1);
    if (deltaY <  MAX_UP)     eff = viscous(deltaY, MAX_UP,   -1);

    if (!raf) {
      raf = requestAnimationFrame(() => {
        trigger  .style.transform = `translate(-50%, ${eff}px)`;
        overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
        raf = null;
      });
    }
  }, { passive:false });

  window.addEventListener('pointerup', () => {
    if (startY===null) return;

    trigger  .style.transition = SPRING;
    overlayBg.style.transition = SPRING;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    /* чат открываем после того, как логотип «отпружинит» */
    if (deltaY < UP_THRESHOLD && !isChatOpen()) {
      setTimeout(openChat, SPRING_MS);
    }
    startY = null;
  });

});
