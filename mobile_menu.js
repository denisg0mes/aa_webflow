document.addEventListener('DOMContentLoaded', () => {
  /* -------- элементы -------- */
  const mobileMenu = document.querySelector('.mobile-menu');
  const trigger    = mobileMenu.querySelector('.menu-trigger');
  const overlay    = mobileMenu.querySelector('.menu-overlay');

  /* -------- flags / helpers -------- */
  const isMenuOpen = () => overlay.classList.contains('open');
  const isChatOpen = () => mobileMenu.classList.contains('chat-open');

  /* -------- константы порогов -------- */
  const UP_THRESHOLD  = -70;  // < −70px  → открыть чат
  const DOWN_MAX      =  40;  // > +40px  → дальше не тянем

  /* -------- базовые функции -------- */
  const reset = () => {
    overlay.classList.remove('open');
    mobileMenu.classList.remove('chat-open');
    document.body.style.overflow = '';
  };

  const openMenu  = () => { overlay.classList.add('open');  mobileMenu.classList.remove('chat-open'); document.body.style.overflow='hidden'; };
  const closeMenu = () => { overlay.classList.remove('open');                                   document.body.style.overflow='';        };
  const openChat  = () => { mobileMenu.classList.add('chat-open'); overlay.classList.add('open'); document.body.style.overflow='hidden';  };
  const closeChat = () => { mobileMenu.classList.remove('chat-open'); overlay.classList.remove('open'); document.body.style.overflow=''; };

  /* сброс при загрузке / bfcache */
  reset();
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });

  /* ---------- КЛИК по логотипу ---------- */
  trigger.addEventListener('click', e => {
    if (dragged) { dragged = false; return; }     // чтобы click не сработал после drag
    if (isChatOpen())      closeChat();
    else if (isMenuOpen()) closeMenu();
    else                   openMenu();
  });

  /* ---------- DRAG & DROP ---------- */
  let startY   = null;
  let deltaY   = 0;
  let dragged  = false;

  /* начало касания */
  trigger.addEventListener('pointerdown', e => {
    startY            = e.clientY;
    deltaY            = 0;
    dragged           = false;
    trigger.style.transition = 'none';            // отключаем анимацию, пока тянем
  });

  /* двигаем палец */
  window.addEventListener('pointermove', e => {
    if (startY === null) return;
    e.preventDefault();                           // блокируем прокрутку страницы

    deltaY = e.clientY - startY;
    if (deltaY >  DOWN_MAX) deltaY =  DOWN_MAX;   // вниз ограничиваем +40
    // вверх можно тянуть сколько угодно; визуально clamp не нужен

    trigger.style.transform = `translate(-50%, ${deltaY}px)`;
    dragged = true;
  }, { passive:false });

  /* отпустили палец */
  window.addEventListener('pointerup', () => {
    if (startY === null) return;
    trigger.style.transition = 'transform .3s cubic-bezier(.16,1,.3,1)'; // возвращаем пружину
    trigger.style.transform  = 'translate(-50%, 0)';                    // назад на место

    if (deltaY < UP_THRESHOLD && !isChatOpen()) {   // тянули вверх далеко
      openChat();
    }
    // если вниз или не дотянули — просто возврат без открытия

    startY = null;
  });

});
