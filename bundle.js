<script>
// bundle.js — галерея на Flickity v2 с alt-тегами
;(function () {
  /** {gallery:my-slug} */
  const TOKEN_RE = /\{gallery:([\w-]+)\}/;

  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('div.w-richtext')
      .forEach(processRichText);
  });

  /** парсим один RichText-блок */
  function processRichText(root) {
    const parts = root.innerHTML.split(/(\{gallery:[\w-]+\})/g);
    root.innerHTML = '';

    parts.forEach(part => {
      const m = part.match(TOKEN_RE);
      if (m) {
        const slug = m[1];
        const wrap = document.createElement('div');
        wrap.className = 'custom-gallery-wrapper';

        const container = document.createElement('div');
        container.className = 'custom-gallery';
        wrap.appendChild(container);

        root.appendChild(wrap);
        loadGallery(container, slug);
      } else {
        root.insertAdjacentHTML('beforeend', part);
      }
    });
  }

  /** грузим картинки и, когда все готовы, стартуем Flickity */
  function loadGallery(container, slug) {
    fetch(`https://n8n.arrivedaliens.com/webhook/getGallery?slug=${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(({ images = [] }) => {
        if (!images.length) {
          console.warn(`Gallery "${slug}" пустая`);
          return;
        }

        let loaded = 0;
        const total = images.length;
        const imgEls = new Array(total);

        images.forEach(({ url, alt = '' }, idx) => {
          const img = document.createElement('img');
          img.className = 'gallery-cell';
          img.src = url;
          img.alt = alt;
          imgEls[idx] = img;

          const done = () => {
            loaded++;
            if (loaded === total) finish();
          };

          if (img.complete && img.naturalWidth) {
            done();
          } else {
            img.onload  = done;
            img.onerror = done;
          }
        });

        // fallback-таймаут (5 с)
        setTimeout(() => {
          if (loaded < total) {
            console.warn(`Gallery "${slug}": таймаут, загружено ${loaded}/${total}`);
            finish();           // инициализируем тем, что есть
          }
        }, 5000);

        function finish () {
          imgEls.forEach(el => container.appendChild(el));
          initFlickity(container);
        }
      })
      .catch(err => console.error(`Gallery "${slug}" error:`, err));
  }

  /** запускаем Flickity один раз */
  function initFlickity(container) {
    if (container.classList.contains('flickity-enabled')) return;

    try {
      const flkty = new Flickity(container, {
        cellSelector       : '.gallery-cell',
        cellAlign          : 'left',
        contain            : true,
        draggable          : true,
        wrapAround         : false,
        pageDots           : true,
        prevNextButtons    : false,
        selectedAttraction : 0.1,
        friction           : 0.9
      });
      flkty.resize();
    } catch (e) {
      console.error('Flickity init failed:', e);
    }
  }
})();
</script>
