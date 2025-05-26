document.addEventListener('DOMContentLoaded', function() {
  console.log('=== ОПРЕДЕЛЯЕМ СТРУКТУРУ МЕНЮ ===');
  
  // Пробуем разные селекторы для поиска меню
  const possibleSelectors = [
    '.menu_item a',
    '.nav_link',
    '.nav-link', 
    'nav a',
    '.navbar a',
    '.navigation a',
    '.menu a',
    '.nav_menu a',
    '[class*="nav"] a',
    '[class*="menu"] a'
  ];
  
  possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`Селектор "${selector}": найдено ${elements.length} элементов`);
    
    if (elements.length > 0) {
      elements.forEach((el, i) => {
        console.log(`  ${i}: href="${el.getAttribute('href')}" text="${el.textContent.trim()}"`);
      });
    }
  });
  
  console.log('\n=== СТРУКТУРА НАВИГАЦИИ ===');
  
  // Ищем все ссылки на странице
  const allLinks = document.querySelectorAll('a[href^="/"]');
  console.log(`Все внутренние ссылки: ${allLinks.length}`);
  
  allLinks.forEach((link, i) => {
    const href = link.getAttribute('href');
    const text = link.textContent.trim();
    const classes = link.className;
    const parent = link.parentElement;
    const parentClasses = parent ? parent.className : 'no parent';
    
    console.log(`${i}: "${text}" → ${href}`);
    console.log(`    Классы ссылки: ${classes}`);
    console.log(`    Классы родителя: ${parentClasses}`);
  });
});
