document.addEventListener('DOMContentLoaded', () => {
  /* ----- элементы ----- */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');

  /* ----- helpers ----- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* ----- лимиты ----- */
  const UP_THRESHOLD = -70;   // открыть чат
  const MAX_UP       = -100;  // дальше вверх не тянем (визуально)
  const DOWN_LIMIT   =  40;   // вниз макс.
  const DAMP = 0.3;           // «вязкость» за пределами

  /* ----- функции ----- */
  const reset = () => {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    overlayBg.style.transform  = '';
    overlayBg.style.transition = '';
    trigger  .style.transform  = 'translate(-50%,0)';
    trigger  .style.transition = '';
    document.body.style.overflow = '';
  };

  const openMenu  = () => {
    overlayBg.style.transform  = '';                    // убрать inline
    overlayBg.style.transition = '';                    // вернуть CSS
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

  /* ----- init / bfcache ----- */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* ----- click ----- */
  let dragged = false;
  trigger.addEventListener('click', () => {
    if (dragged) { dragged=false; return; }
    if      (isChatOpen()) closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* ----- drag ----- */
  let startY=null, deltaY=0;

  function damp(val, limit, sign){
    /* «вязкость» когда вышли за limit */
    const over = sign>0 ? val-limit : limit-val;
    return sign>0
       ? limit + over*DAMP
       : limit - over*DAMP;
  }

  trigger.addEventListener('pointerdown', e=>{
    startY  = e.clientY;
    deltaY  = 0;
    dragged = false;
    trigger  .style.transition = 'none';
    overlayBg.style.transition = 'none';
  });

  window.addEventListener('pointermove', e=>{
    if (startY===null) return;
    deltaY = e.clientY - startY;

    let eff = deltaY;
    if (deltaY >  DOWN_LIMIT) eff = damp(deltaY, DOWN_LIMIT,+1);
    if (deltaY <  MAX_UP)     eff = damp(deltaY, MAX_UP,   -1);

    if (Math.abs(eff) > 3) e.preventDefault();

    trigger  .style.transform = `translate(-50%, ${eff}px)`;
    overlayBg.style.transform = `translate(-50%, ${eff}px) scale(1)`;
    dragged = true;
  }, {passive:false});

  window.addEventListener('pointerup', ()=>{
    if (startY===null) return;
    const spring = 'transform .3s cubic-bezier(.16,1,.3,1)';
    trigger  .style.transition = spring;
    overlayBg.style.transition = spring;
    trigger  .style.transform  = 'translate(-50%,0)';
    overlayBg.style.transform  = 'translate(-50%,0) scale(1)';

    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    startY = null;
  });

});
