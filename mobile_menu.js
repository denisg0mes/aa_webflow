document.addEventListener('DOMContentLoaded', () => {
  /* ---------- элементы ---------- */
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) return;

  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');
  const overlayBg  = mobileMenu.querySelector('.overlay-bg');

  /* ---------- утилиты ---------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  const reset = () => {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = '';
  };

  /* ---------- состояния ---------- */
  const openMenu  = () => { overlay.classList.add('open');  mobileMenu.classList.remove('chat-open'); document.body.style.overflow='hidden'; };
  const closeMenu = () => { overlay.classList.remove('open');                                   document.body.style.overflow='';        };
  const openChat  = () => { mobileMenu.classList.add('chat-open'); overlay.classList.add('open'); document.body.style.overflow='hidden';  };
  const closeChat = () => { mobileMenu.classList.remove('chat-open'); overlay.classList.remove('open'); document.body.style.overflow=''; };

  /* ---------- инициализация / bfcache ---------- */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* ---------- click ---------- */
  let dragged = false;
  trigger.addEventListener('click', () => {
    if (dragged) { dragged = false; return; }          // игнор клика после drag
    if (isChatOpen())      closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* ---------- DRAG ---------- */
  const UP_THRESHOLD  = -70;     // открыть чат
  const DOWN_LIMIT    =  40;     // макс. физический ход вниз

  let startY  = null;
  let deltaY  = 0;

  /* helper: «вязкий» вниз */
  function viscous(dy) {
    if (dy <= DOWN_LIMIT) return dy;
    // за границей 40 px двигаемся медленнее
    return DOWN_LIMIT + (dy - DOWN_LIMIT) * 0.3;
  }

  /* pointerdown */
  trigger.addEventListener('pointerdown', e => {
    startY = e.clientY;
    deltaY = 0;
    dragged = false;
    // отключаем переходы, чтобы не мешали во время перетягивания
    trigger.style.transition   = 'none';
    overlayBg.style.transition = 'none';
  });

  /* pointermove */
  window.addEventListener('pointermove', e => {
    if (startY === null) return;

    deltaY = e.clientY - startY;
    const effDY = deltaY > 0 ? viscous(deltaY) : deltaY;   // вниз вязко

    /* блокируем скролл, если палец реально двигает по вертикали */
    if (Math.abs(effDY) > 3) e.preventDefault();

    trigger   .style.transform = `translate(-50%, ${effDY}px)`;
    overlayBg.style.transform  = `translate(-50%, ${effDY}px) scale(1)`;

    dragged = true;
  }, { passive:false });

  /* pointerup */
  window.addEventListener('pointerup', () => {
    if (startY === null) return;

    // возвращаем пружину
    const spring = 'transform .3s cubic-bezier(.16,1,.3,1)';
    trigger  .style.transition = spring;
    overlayBg.style.transition = spring;

    trigger  .style.transform = 'translate(-50%, 0)';
    overlayBg.style.transform = 'translate(-50%, 0) scale(1)';

    // открытие чата при достаточном подъёме
    if (deltaY < UP_THRESHOLD && !isChatOpen()) openChat();

    /* сброс */
    startY = null;
  });
});
