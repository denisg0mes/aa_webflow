document.addEventListener('DOMContentLoaded', function() {
  console.log('Скрипт загружен');
  
  const currentPath = window.location.pathname;
  console.log('Текущий путь:', currentPath);
  
  const menuItems = document.querySelectorAll('.menu_item a');
  console.log('Найдено пунктов меню:', menuItems.length);
  
  // Выводим все найденные пункты меню
  menuItems.forEach((item, index) => {
    const href = item.getAttribute('href');
    console.log(`Пункт меню ${index}: href="${href}"`);
  });
  
  // Определяем родительские разделы (БЕЗ слешей в конце)
  const sections = [
    '/projects',
    '/about', 
    '/services',
    '/blog',
    '/team'
  ];
  
  console.log('Проверяемые разделы:', sections);
  
  // Проверяем каждый раздел
  sections.forEach(sectionPath => {
    console.log(`\n--- Проверяем раздел: ${sectionPath} ---`);
    
    // Проверяем, является ли текущая страница вложенной страницей этого раздела
    const isSubpage = currentPath.startsWith(sectionPath + '/');
    const isMainPage = currentPath === sectionPath;
    
    console.log(`Это подстраница ${sectionPath}?`, isSubpage);
    console.log(`Это главная страница ${sectionPath}?`, isMainPage);
    
    if (isSubpage && !isMainPage) {
      console.log(`✓ Найдена подстраница раздела: ${sectionPath}`);
      
      // Ищем соответствующий пункт меню
      let found = false;
      menuItems.forEach((item, index) => {
        const href = item.getAttribute('href');
        console.log(`  Проверяем пункт ${index}: "${href}" === "${sectionPath}"?`, href === sectionPath);
        
        if (href === sectionPath) {
          const menuItem = item.closest('.menu_item');
          if (menuItem) {
            console.log('  ✓ Пункт меню найден, добавляем класс section-active');
            menuItem.classList.add('section-active');
            
            // Проверяем, что класс добавился
            const hasClass = menuItem.classList.contains('section-active');
            console.log('  Класс section-active добавлен?', hasClass);
            found = true;
          } else {
            console.log('  ✗ Не найден родительский .menu_item');
          }
        }
      });
      
      if (!found) {
        console.log(`  ✗ Не найден пункт меню для раздела: ${sectionPath}`);
      }
    }
  });
  
  // Дополнительная проверка: выводим все элементы с классом section-active
  setTimeout(() => {
    const activeItems = document.querySelectorAll('.menu_item.section-active');
    console.log('\nЭлементы с классом section-active:', activeItems.length);
    activeItems.forEach((item, index) => {
      console.log(`Активный элемент ${index}:`, item);
    });
  }, 100);
});
