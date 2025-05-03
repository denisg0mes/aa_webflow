// bundle.js  — версия с Flickity
;(function () {
  /** 1. Ждём загрузки DOM */
  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('div.w-richtext')
      .forEach(processRichTextBlock);
  });

  /** 2. Разбираем Rich Text на куски, вставляем галереи */
  function processRichTextBlock(root) {
    const parts = root.innerHTML.split(/(\{gallery:[\w-]+\})/g);
    root.innerHTML = '';

    parts.forEach(part => {
      const m = part.match(/^\{gallery:([\w-]+)\}$/);
      if (m) {
        /** галерея */
        const slug = m[1];
        const wrap = document.createElement('div');
        wrap.className = 'custom-gallery-wrapper';
        wrap.innerHTML = `<div class="custom-gallery"></div>`;
        root.appendChild(wrap);
        loadGallery(wrap.querySelector('.custom-gallery'), slug);
      } else {
        /** обычный текст/HTML */
        root.insertAdjacentHTML('beforeend', part);
      }
    });
  }

  /** 3. Загружаем JSON и инициализируем Flickity */
  function loadGallery(container, slug) {
    fetch(
      `https://n8n.denisgomes.me/webhook/getGallery?slug=${encodeURIComponent(
        slug
      )}`
    )
      .then(r => r.json())
      .then(data => {
        (data.images || []).forEach(src => {
          const img = document.createElement('img');
          img.className = 'gallery-cell';
          img.src = src;
          container.appendChild(img);
        });

        /* Инициализация Flickity после вставки всех изображений */
        new Flickity(container, {
          cellSelector: '.gallery-cell',
          draggable: true,
          freeScroll: true,
          wrapAround: true,
          imagesLoaded: true,
          pageDots: true,
          prevNextButtons: false,
          selectedAttraction: 0.02, // более плавная инерция
          friction: 0.9
        });
      })
      .catch(err => console.error('Gallery load error:', err));
  }
})();
