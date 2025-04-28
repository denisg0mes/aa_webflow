// bundle.js
;(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // 1) находим все Rich Text-контейнеры
    document.querySelectorAll('div.w-richtext').forEach(root => {
      const raw = root.innerHTML;
      // разбиваем на HTML-куски и маркеры
      const parts = raw.split(/(\{gallery:[\w-]+\})/g);
      root.innerHTML = ''; // очищаем

      parts.forEach(part => {
        const m = part.match(/^\{gallery:([\w-]+)\}$/);
        if (m) {
          const slug = m[1];
          // 2) вставляем шаблон-обёртку
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-gallery-wrapper';
          wrapper.innerHTML = `
            <div class="custom-gallery"></div>
            <div class="custom-gallery-pagination"></div>
          `;
          root.appendChild(wrapper);
          // 3) грузим данные и рендерим
          loadAndInitGallery(wrapper, slug);
        } else {
          // просто HTML
          root.insertAdjacentHTML('beforeend', part);
        }
      });
    });
  });

  function loadAndInitGallery(wrapper, slug) {
    const gallery = wrapper.querySelector('.custom-gallery');
    const pagination = wrapper.querySelector('.custom-gallery-pagination');

    // fetch URL-ов
    fetch(`https://n8n.denisgomes.me/webhook/getGallery?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        const urls = data.images || [];
        // вставляем <img>
        urls.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          wrapper.querySelector('.custom-gallery').appendChild(img);
        });
        // инициализируем вашу existing-логику
        initScrollGallery(wrapper);
      })
      .catch(console.error);
  }

  function initScrollGallery(wrapper) {
    const gallery = wrapper.querySelector('.custom-gallery');
    const pagination = wrapper.querySelector('.custom-gallery-pagination');
    const imgs = Array.from(gallery.querySelectorAll('img'));
    const count = imgs.length;
    let offsets = [], currentIndex = 0;

    function computeOffsets() { offsets = imgs.map(i => i.offsetLeft); }
    function initPagination() {
      pagination.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'pagination-dot' + (i === 0 ? ' active' : '');
        pagination.appendChild(dot);
      }
    }
    function updatePagination() {
      const scrollX = gallery.scrollLeft;
      let best = 0, bd = Infinity;
      offsets.forEach((off, i) => {
        const d = Math.abs(off - scrollX);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== currentIndex) {
        pagination.children[currentIndex].classList.remove('active');
        pagination.children[best].classList.add('active');
        currentIndex = best;
      }
    }
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
      gallery.style.height = `${Math.round(window.innerWidth / maxRatio)}px`;
    }
    function attachDrag() {
      const dragSpeed = 1.5;
      let isDown = false, sx, sl;
      gallery.addEventListener('mousedown', e => {
        isDown = true;
        sx = e.pageX - gallery.offsetLeft;
        sl = gallery.scrollLeft;
        gallery.classList.add('dragging');
      });
      ['mouseleave', 'mouseup'].forEach(ev =>
        gallery.addEventListener(ev, () => {
          if (!isDown) return;
          isDown = false;
          gallery.classList.remove('dragging');
          updatePagination();
          gallery.scrollTo({ left: offsets[currentIndex], behavior: 'smooth' });
        })
      );
      gallery.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const delta = (e.pageX - gallery.offsetLeft - sx);
        gallery.scrollLeft = sl - delta * dragSpeed;
      });

      gallery.addEventListener('touchstart', e => {
        isDown = true;
        sx = e.touches[0].pageX - gallery.offsetLeft;
        sl = gallery.scrollLeft;
      });
      ['touchend', 'touchcancel'].forEach(ev =>
        gallery.addEventListener(ev, () => {
          if (!isDown) return;
          isDown = false;
          updatePagination();
          gallery.scrollTo({ left: offsets[currentIndex], behavior: 'smooth' });
        })
      );
      gallery.addEventListener('touchmove', e => {
        if (!isDown) return;
        const delta = (e.touches[0].pageX - gallery.offsetLeft - sx);
        gallery.scrollLeft = sl - delta * dragSpeed;
      });
    }

    computeOffsets();
    initPagination();
    adjustHeight();
    attachDrag();
    gallery.addEventListener('scroll', updatePagination);
    window.addEventListener('resize', () => { computeOffsets(); adjustHeight(); });
  }
})();
