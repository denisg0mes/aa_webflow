// bundle.js — галерея на Flickity 2
;(function () {
  /** Регэкс вида {gallery:my-slug} */
  const TOKEN_RE = /\{gallery:([\w-]+)\}/;

  /** Стартуем, когда DOM готов */
  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('div.w-richtext')
      .forEach(parseRichTextBlock);
  });

  /** Ищем плейсхолдеры в Rich Text и заменяем их на галереи */
  function parseRichTextBlock(root) {
    const parts = root.innerHTML.split(/(\{gallery:[\w-]+\})/g);
    root.innerHTML = '';

    parts.forEach(part => {
      const m = part.match(TOKEN_RE);
      if (m) {
        const slug = m[1];
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-gallery-wrapper';

        const container = document.createElement('div');
        container.className = 'custom-gallery';

        wrapper.appendChild(container);
        root.appendChild(wrapper);

        loadGallery(container, slug);
      } else {
        root.insertAdjacentHTML('beforeend', part);
      }
    });
  }

  /** Запрашиваем изображения и инициализируем Flickity */
  function loadGallery(container, slug) {
    fetch(`https://n8n.denisgomes.me/webhook/getGallery?slug=${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        (data.images || []).forEach(src => {
          const img = document.createElement('img');
          img.className = 'gallery-cell';
          img.loading = 'lazy';
          img.src = src;
          container.appendChild(img);
        });

        if (container.children.length) {
          new Flickity(container, {
            cellSelector: '.gallery-cell',
            draggable: true,
            freeScroll: true,
            wrapAround: true,
            imagesLoaded: true,
            pageDots: true,
            prevNextButtons: false,
            selectedAttraction: 0.03,
            friction: 0.9
          });
        }
      })
      .catch(err => console.error('Gallery load error:', err));
  }
})();
