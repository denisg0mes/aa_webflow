// richtext-content.js
// Скрипт для управления классами обёрток картинок в Rich Text и удаления inline-стилей fullwidth-фигур

document.addEventListener('DOMContentLoaded', () => {
  // 1) Убираем inline max-width у fullwidth-figures
  document.querySelectorAll('.w-richtext figure.w-richtext-align-fullwidth')
    .forEach(fig => {
      fig.removeAttribute('style');
    });

  // 2) Добавляем класс на обёртки картинок согласно alt-типа
  document.querySelectorAll('.w-richtext img').forEach(img => {
    // пропускаем картинки из галереи
    if (img.closest('.custom-gallery')) return;
    const type = img.alt.trim().toLowerCase();
    if (!['wide', 'vertical', 'horizontal'].includes(type)) return;
    // Обёртка — <div> внутри <figure>
    const wrapper = img.parentElement;
    if (wrapper && wrapper.tagName === 'DIV') {
      wrapper.classList.add(`rt-wrapper--${type}`);
    }
  });
});
