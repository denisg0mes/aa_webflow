// bundle.js
;(function() {
  const wrapper = document.querySelector('.custom-gallery-wrapper');
  if (!wrapper) return;
  const gallery = wrapper.querySelector('.custom-gallery');
  const pagination = wrapper.querySelector('.custom-gallery-pagination');

  const imgs = Array.from(gallery.querySelectorAll('img'));
  const count = imgs.length;
  let offsets = [];
  let currentIndex = 0;

  // Helper: вычисляем смещения каждой картинки
  function computeOffsets() {
    offsets = imgs.map(img => img.offsetLeft);
  }

  // Настройка пагинации
  function initPagination() {
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('div');
      dot.className = 'pagination-dot' + (i === 0 ? ' active' : '');
      pagination.appendChild(dot);
    }
  }

  // Обновляем активный индекс и класс у точек
  function updatePagination() {
    const scrollX = gallery.scrollLeft;
    let best = 0, bestDiff = Infinity;
    offsets.forEach((off, i) => {
      const diff = Math.abs(off - scrollX);
      if (diff < bestDiff) {
        bestDiff = diff; best = i;
      }
    });
    if (best !== currentIndex) {
      const dots = pagination.children;
      dots[currentIndex].classList.remove('active');
      dots[best].classList.add('active');
      currentIndex = best;
    }
  }

  // Динамическая высота на мобилках
  function adjustHeight() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      gallery.style.height = '800px';
      return;
    }
    let maxRatio = 1;
    imgs.forEach(img => {
      const r = img.naturalWidth / img.naturalHeight;
      if (r > maxRatio) maxRatio = r;
    });
    const newH = window.innerWidth / maxRatio;
    gallery.style.height = `${Math.round(newH)}px`;
  }

  // Drag / swipe
  let isDown = false, startX, scrollLeft;
  gallery.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
    gallery.classList.add('dragging');
  });
  ['mouseleave','mouseup'].forEach(evt =>
    gallery.addEventListener(evt, () => {
      isDown = false;
      gallery.classList.remove('dragging');
      updatePagination();
    })
  );
  gallery.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    gallery.scrollLeft = scrollLeft - (x - startX);
  });

  gallery.addEventListener('touchstart', e => {
    isDown = true;
    startX = e.touches[0].pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
  });
  ['touchend','touchcancel'].forEach(evt =>
    gallery.addEventListener(evt, () => {
      isDown = false;
      updatePagination();
    })
  );
  gallery.addEventListener('touchmove', e => {
    if (!isDown) return;
    gallery.scrollLeft = scrollLeft - (e.touches[0].pageX - startX);
  });

  // Инициализация
  window.addEventListener('load', () => {
    computeOffsets();
    initPagination();
    adjustHeight();
  });
  window.addEventListener('resize', () => {
    computeOffsets();
    adjustHeight();
  });
})();

