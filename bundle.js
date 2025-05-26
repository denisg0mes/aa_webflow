// bundle.js — галерея на Flickity 2 (исправленная версия)
;(function () {
  /** Регэкс вида {gallery:my-slug} */
  const TOKEN_RE = /\{gallery:([\w-]+)\}/;
  
  /** Стартуем, когда DOM готов */
  document.addEventListener('DOMContentLoaded', () => {
    document
      .querySelectorAll('div.w-richtext')
      .forEach(parseRichTextBlock);
  });
  
  /** Ищем плейсхолдеры в Rich Text и заменяем их на галереи */
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
  
  /** Запрашиваем изображения и инициализируем Flickity после их загрузки */
  function loadGallery(container, slug) {
    fetch(`https://n8n.arrivedaliens.com/webhook/getGallery?slug=${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const images = data.images || [];
        if (!images.length) {
          console.warn(`Gallery "${slug}" has no images`);
          return;
        }
        
        let loadedCount = 0;
        const totalImages = images.length;
        const imageElements = [];
        
        // Сначала создаем ВСЕ элементы изображений
        images.forEach((src, index) => {
          const img = document.createElement('img');
          img.className = 'gallery-cell';
          img.src = src;
          imageElements[index] = img;
          
          // Обработчик загрузки каждого изображения
          const onImageLoad = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              // Добавляем ВСЕ изображения СРАЗУ в правильном порядке
              imageElements.forEach(imgEl => {
                container.appendChild(imgEl);
              });
              // Только потом инициализируем Flickity
              initializeFlickity(container);
            }
          };
          
          // Проверяем, не загружено ли уже (из кэша)
          if (img.complete && img.naturalWidth > 0) {
            onImageLoad();
          } else {
            img.onload = onImageLoad;
            img.onerror = () => {
              console.warn(`Failed to load image: ${src}`);
              onImageLoad(); // тоже считаем как "обработанное"
            };
          }
        });
        
        // Таймаут безопасности на случай, если что-то пойдет не так
        setTimeout(() => {
          if (loadedCount < totalImages && imageElements.length > 0) {
            console.warn(`Gallery "${slug}": timeout reached, initializing with ${loadedCount}/${totalImages} loaded images`);
            // Добавляем загруженные изображения
            imageElements.forEach(imgEl => {
              if (imgEl.complete || imgEl.src) {
                container.appendChild(imgEl);
              }
            });
            initializeFlickity(container);
          }
        }, 5000); // уменьшаем таймаут до 5 секунд
      })
      .catch(err => {
        console.error(`Gallery "${slug}" load error:`, err);
      });
  }
  
  /** Инициализируем Flickity после загрузки всех изображений */
  function initializeFlickity(container) {
    // Проверяем, не инициализирована ли уже галерея
    if (container.classList.contains('flickity-enabled')) {
      return;
    }
    
    try {
      const flickityInstance = new Flickity(container, {
        cellSelector: '.gallery-cell',
        draggable: true,
        // freeScroll: true,
        wrapAround: false,
        pageDots: true,
        prevNextButtons: false,
        selectedAttraction: 0.1,
        friction: 0.9,
        cellAlign: 'left',
        contain: true
        // убираем imagesLoaded: true - делаем это вручную
      });
      
      // CSS должен управлять высотой
      flickityInstance.resize(); // пересчитываем размеры
      
      console.log('Gallery initialized successfully');
    } catch (err) {
      console.error('Flickity initialization error:', err);
    }
  }
})();
