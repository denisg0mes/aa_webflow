document.addEventListener('DOMContentLoaded', () => {

  /* ---- Находим ВСЕ мобильные меню (если их несколько) ---- */
  const allMenus = document.querySelectorAll('.mobile-menu');
  if (!allMenus.length) return;

  /* ---- Цикл по каждому компоненту ---- */
  allMenus.forEach(mobileMenu => {
    const trigger = mobileMenu.querySelector('.menu-trigger');
    const overlay = mobileMenu.querySelector('.menu-overlay');

    if (!trigger || !overlay) return;

    /* helpers */
    const isMenuOpen = () => overlay.classList.contains('open');
    const isChatOpen = () => mobileMenu.classList.contains('chat-open');

    /* базовые действия */
    const reset = () => {
      overlay.classList.remove('open');
      mobileMenu.classList.remove('chat-open');
      document.body.style.overflow = '';
    };
    const openMenu  = () => { overlay.classList.add('open');  mobileMenu.classList.remove('chat-open'); document.body.style.overflow='hidden'; };
    const closeMenu = () => { overlay.classList.remove('open');                                   document.body.style.overflow='';        };
    const openChat  = () => { mobileMenu.classList.add('chat-open'); overlay.classList.add('open'); document.body.style.overflow='hidden';  };
    const closeChat = () => { mobileMenu.classList.remove('chat-open'); overlay.classList.remove('open'); document.body.style.overflow=''; };

    /* при загрузке / bfcache */
    reset();
    window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

    /* ---------- КЛИК ---------- */
    trigger.addEventListener('click', () => {
      if (dragged) { dragged=false; console.log('tap cancelled (drag)'); return; }

      if (isChatOpen())      { console.log('close chat'); closeChat(); }
      else if (isMenuOpen()) { console.log('close menu'); closeMenu(); }
      else                   { console.log('open menu');  openMenu();  }
    });

    /* ---------- DRAG ---------- */
    const UP_THRESHOLD = -70;   // px
    const DOWN_MAX     =  40;

    let startY  = null;
    let deltaY  = 0;
    let dragged = false;

    trigger.addEventListener('pointerdown', e => {
      startY = e.clientY;
      deltaY = 0;
      dragged = false;
      trigger.style.transition = 'none';
    });

    /* pointermove */
    window.addEventListener('pointermove', e => {
      if (startY === null) return;

      deltaY = e.clientY - startY;

      /* разрешаем скролл страницы, если палец идёт по горизонтали —
         иначе preventDefault делаем только когда реально двигаем вверх/вниз */
      if (Math.abs(deltaY) > 2) e.preventDefault();

      if (deltaY >  DOWN_MAX) deltaY =  DOWN_MAX;
      trigger.style.transform = `translate(-50%, ${deltaY}px)`;
      dragged = true;
    }, { passive:false });

    window.addEventListener('pointerup', () => {
      if (startY === null) return;
      trigger.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1)';
      trigger.style.transform  = 'translate(-50%, 0)';
      if (deltaY < UP_THRESHOLD && !isChatOpen()) {
        console.log('open chat');
        openChat();
      }
      startY = null;
    });
  });

});
