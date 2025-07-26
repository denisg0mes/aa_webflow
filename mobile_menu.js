document.addEventListener('DOMContentLoaded', () => {
  /* ---------- элементы компонента ---------- */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger   = mobileMenu.querySelector('.menu-trigger');   // логотип
  const overlay   = mobileMenu.querySelector('.menu-overlay');   // контейнер
  const overlayBg = mobileMenu.querySelector('.overlay-bg');     // белый овал

  /* ---------- утилиты ---------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* ---------- пороги и «вязкость» ---------- */
  const DRAG_THRESHOLD = 10;     // до 10 px считаем «тап», а не drag
  const UP_THRESHOLD   = -70;    // выше 70 px → открыть чат
  const MAX_UP         = -100;   // физический лимит вверх
  const DOWN_LIMIT     =  40;    // физический лимит вниз
  const DAMP           =  0.3;   // замедление за пределом

  const spring = 'transform .3s cubic-bezier(.16,1,.3,1)';       // пружина
  const bgScaleTransition = 'transform .45s ease';               // масштаб овала

  const viscous = (dy, limit, sign) => {
    const over = sign > 0 ? dy - limit : limit - dy;
    return sign > 0
      ? limit + over * DAMP
      : limit - over * DAMP;
  };

  /* ---------- сброс ---------- */
  function reset() {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    overlayBg.style.transition = '';
    overlayBg.style.transform  = '';
    trigger  .style.transition = '';
    trigger  .style.transform  = 'translate(-50%,0)';
    document.body.style.overflow = '';
  }

  /* ---------- режимы ---------- */
  function openMenu() {
    overlayBg.style.transition = bgScaleTransition;   // вернуть плавность
    overlayBg.style.transform  = '';                  // scale(20) → CSS
    overlay.classList.add('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    overlayBg.style.transition = bgScaleTransition;
    overlay.classList.remove('open');
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';
    document.body.style.overflow = '';
  }
  function openChat() {
    mobileMenu.classList.add('chat-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  const closeChat = () => { mobileMenu.classList.remove('chat-open'); closeMenu(); };

  /* ---------- инициализация / bfcache ---------- */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* ---------- click ---------- */
  let dragged = false;   // чтобы клик не срабатывал сразу после drag
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }
    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* ---------- drag ---------- */
  let startY = null, deltaY = 0;

  trigger.addEventListener('pointerdown', e => {
    startY = e.clientY;
    deltaY = 0;
    trigger  .style.transition = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e => {
    if (startY === null) return;

    deltaY = e.clientY - startY;
    const absDY = Math.abs(deltaY);

    /* включаем drag, когда вышли за 10 px и блокируем прокрутку */
    if (absDY > DRAG_THRESHOLD) {
      dragged = true;
      e.preventDefault();
    }

    /* «вязкость» за пределами */
    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = viscous(deltaY, DOWN_LIMIT, +1);
    if (deltaY <  MAX_UP)     eff = viscous(deltaY, MAX_UP,   -1);

    trigger  .style.transform = `translate(-50%, ${eff}px)`;
    overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
  }, { passive:false });

  window.addEventListener('pointerup', () => {
    if (startY === null) return;

    trigger  .style.transition = spring;
    overlayBg.style.transition = spring;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    startY = null;
  });
});
