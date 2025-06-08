// richtext-content.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Убираем inline max-width у fullwidth-figur
  document.querySelectorAll('.w-richtext figure.w-richtext-align-fullwidth')
    .forEach(fig => {
      fig.removeAttribute('style');
    });

  // 2) Готовим регулярку для поиска тега в alt
  const TAG_RE = /\{(wide|horizontal|vertical)\}/i;

  // 3) Обрабатываем все картинки в Rich Text
  document.querySelectorAll('.w-richtext img').forEach(img => {
    // пропускаем картинки из галереи
    if (img.closest('.custom-gallery')) return;

    const alt = img.alt;
    const match = alt.match(TAG_RE);
    if (!match) return;                       // нет тега — ничего не делаем
    const type = match[1].toLowerCase();      // извлекаем тип из {…}

    // удаляем сам тег из alt, оставляя описание
    img.alt = alt.replace(match[0], '').trim();
    
    // 4) Добавляем класс на обёртку — <div> внутри <figure>
    const wrapper = img.parentElement;
    if (wrapper && wrapper.tagName === 'DIV') {
      wrapper.classList.add(`rt-wrapper--${type}`);
    }
  });
});
