(function () {
  // Открытие
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open-modal]');
    if (!opener) return;

    const id   = opener.getAttribute('data-open-modal');
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
  });

  // Закрытие (фон, крестик, Esc)
  const closeModal = modal => {
    modal.classList.remove('is-open');
    // ждём окончание transition, потом убираем scroll-lock
    setTimeout(() => {
      if (!document.querySelector('.modal.is-open')) {
        document.body.classList.remove('modal-open');
      }
    }, 400); // 0.4 s — максимум из transition
  };

  document.addEventListener('click', e => {
    const closer = e.target.closest('[data-close-modal]');
    if (!closer) return;

    const modal = e.target.closest('.modal');
    if (modal) closeModal(modal);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.is-open');
      if (openModal) closeModal(openModal);
    }
  });
})();
