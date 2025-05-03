document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.w-richtext img').forEach(img => {
    // пропускаем картинки галереи
    if (img.closest('.custom-gallery')) return;
    const type = img.alt.trim().toLowerCase();
    if (!['wide','vertical','horizontal'].includes(type)) return;
    // parentElement — это <div> внутри <figure>
    const wrapper = img.parentElement;
    if (wrapper && wrapper.tagName === 'DIV') {
      // добавляем класс на обёртку, а не на сам img
      wrapper.classList.add(`rt-wrapper--${type}`);
    }
  });
});
