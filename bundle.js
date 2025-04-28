// bundle.js
;(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // Ищем все Rich Text-блоки с плейсхолдерами
    document.querySelectorAll('div.w-richtext').forEach(processRichText);
  });

  function processRichText(root) {
    const raw = root.innerHTML;
    const parts = raw.split(/(\{gallery:[\w-]+\})/g);
    root.innerHTML = '';

    parts.forEach(part => {
      const match = part.match(/^\{gallery:([\w-]+)\}$/);
      if (match) {
        const slug = match[1];
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-gallery-wrapper';
        wrapper.innerHTML = `
          <div class="custom-gallery"></div>
          <div class="custom-gallery-pagination"></div>
        `;
        root.appendChild(wrapper);
        loadAndInitGallery(wrapper, slug);
      } else {
        root.insertAdjacentHTML('beforeend', part);
      }
    });
  }

  function loadAndInitGallery(wrapper, slug) {
    fetch(`https://n8n.denisgomes.me/webhook/getGallery?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        const gallery = wrapper.querySelector('.custom-gallery');
        (data.images || []).forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          gallery.appendChild(img);
        });
        initScrollGallery(wrapper);
      })
      .catch(err => console.error('Gallery load error:', err));
  }

  function initScrollGallery(wrapper) {
    const gallery = wrapper.querySelector('.custom-gallery');
    const pagination = wrapper.querySelector('.custom-gallery-pagination');
    const imgs = Array.from(gallery.querySelectorAll('img'));
    const count = imgs.length;
    let offsets = [];
    let currentIndex = 0;

    function computeOffsets() {
      offsets = imgs.map(img => img.offsetLeft);
    }

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
      let best = 0;
      let bestDiff = Infinity;
      offsets.forEach((off, i) => {
        const diff = Math.abs(off - scrollX);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      });
      if (best !== currentIndex) {
        pagination.children[currentIndex].classList.remove('active');
        pagination.children[best].classList.add('active');
        currentIndex = best;
      }
    }

    function adjustHeight() {
      if (window.innerWidth > 768) {
        gallery.style.height = '800px';
      } else {
        let maxRatio = 1;
        imgs.forEach(img => {
          const r = img.naturalWidth / img.naturalHeight;
          if (r > maxRatio) maxRatio = r;
        });
        gallery.style.height = `${Math.round(window.innerWidth / maxRatio)}px`;
      }
    }

    function attachDrag() {
      gallery.style.touchAction = 'pan-x';
      gallery.style.scrollBehavior = 'smooth';
      let isDown = false;
      let startX = 0;
      let scrollStart = 0;

      gallery.addEventListener('pointerdown', e => {
        isDown = true;
        gallery.style.scrollBehavior = 'auto';
        startX = e.clientX;
        scrollStart = gallery.scrollLeft;
        gallery.setPointerCapture(e.pointerId);
        gallery.classList.add('dragging');
      });

      gallery.addEventListener('pointermove', e => {
        if (!isDown) return;
        const delta = e.clientX - startX;
        gallery.scrollLeft = scrollStart - delta;
      });

      function finishDrag(e) {
        if (!isDown) return;
        isDown = false;
        gallery.releasePointerCapture(e.pointerId);
        gallery.classList.remove('dragging');
        computeOffsets();
        updatePagination();
        gallery.style.scrollBehavior = 'smooth';
        gallery.scrollTo({ left: offsets[currentIndex], behavior: 'smooth' });
      }

      gallery.addEventListener('pointerup', finishDrag);
      gallery.addEventListener('pointercancel', finishDrag);
    }

    computeOffsets();
    initPagination();
    adjustHeight();
    attachDrag();
    gallery.addEventListener('scroll', updatePagination);
    window.addEventListener('resize', () => {
      computeOffsets();
      adjustHeight();
    });
  }
})();
