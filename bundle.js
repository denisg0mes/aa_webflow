// bundle.js
;(function() {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('div.w-richtext').forEach(root => {
      const raw = root.innerHTML;
      const parts = raw.split(/(\{gallery:[\w-]+\})/g);
      root.innerHTML = '';

      parts.forEach(part => {
        const m = part.match(/^\{gallery:([\w-]+)\}$/);
        if (m) {
          const slug = m[1];
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
    });
  });

  function loadAndInitGallery(wrapper, slug) {
    fetch(`https://n8n.denisgomes.me/webhook/getGallery?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        const gallery = wrapper.querySelector('.custom-gallery');
        data.images.forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          gallery.appendChild(img);
        });
        initScrollGallery(wrapper);
      })
      .catch(console.error);
  }

  function initScrollGallery(wrapper) {
    const gallery = wrapper.querySelector('.custom-gallery');
    const pagination = wrapper.querySelector('.custom-gallery-pagination');
    const imgs = Array.from(gallery.querySelectorAll('img'));
    const count = imgs.length;
    let offsets = [];
    let currentIndex = 0;

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
      let isDown = false;
      let startX = 0;
      let scrollStart = 0;

      gallery.addEventListener('mousedown', e => {
        isDown = true;
        gallery.style.scrollBehavior = 'auto';
        startX = e.pageX - gallery.offsetLeft;
        scrollStart = gallery.scrollLeft;
        gallery.classList.add('dragging');
      });
      ['mouseleave', 'mouseup'].forEach(evt =>
        gallery.addEventListener(evt, () => {
          if (!isDown) return;
          isDown = false;
          gallery.classList.remove('dragging');
          computeOffsets();
          updatePagination();
          gallery.style.scrollBehavior = 'smooth';
          gallery.scrollTo({ left: offsets[currentIndex], behavior: 'smooth' });
        })
      );
      gallery.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const delta = e.pageX - gallery.offsetLeft - startX;
        gallery.scrollLeft = scrollStart - delta;
      });

      gallery.addEventListener('touchstart', e => {
        isDown = true;
        gallery.style.scrollBehavior = 'auto';
        startX = e.touches[0].pageX - gallery.offsetLeft;
        scrollStart = gallery.scrollLeft;
      });
      ['touchend', 'touchcancel'].forEach(evt =>
        gallery.addEventListener(evt, () => {
          if (!isDown) return;
          isDown = false;
          gallery.classList.remove('dragging');
          computeOffsets();
          updatePagination();
          gallery.style.scrollBehavior = 'smooth';
          gallery.scrollTo({ left: offsets[currentIndex], behavior: 'smooth' });
        })
      );
      gallery.addEventListener('touchmove', e => {
        if (!isDown) return;
        const delta = e.touches[0].pageX - gallery.offsetLeft - startX;
        gallery.scrollLeft = scrollStart - delta;
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
