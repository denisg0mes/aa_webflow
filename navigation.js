document.addEventListener('DOMContentLoaded', function() {
  console.log('Скрипт загружен');
  
  const currentPath = window.location.pathname;
  console.log('Текущий путь:', currentPath);
  
  // Используем правильный селектор для ваших ссылок
  const menuItems = document.querySelectorAll('.menu_item');
  console.log('Найдено пунктов меню:', menuItems.length);
  
  // Определяем родительские разделы
  const sections = [
    '/projects',
    '/explorations', 
    '/about-us',
    '/contacts'
  ];
  
  console.log('Проверяемые разделы:', sections);
  
  // Проверяем каждый раздел
  sections.forEach(sectionPath => {
    console.log(`\n--- Проверяем раздел: ${sectionPath} ---`);
    
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
          console.log('  ✓ Пункт меню найден, запускаем анимацию');
          
          // ===== АНИМАЦИЯ ЗАГРУЗКИ =====
          
          // 1. Сначала добавляем класс для плавного перехода
          const navMenu = document.querySelector('.nav_menu');
          if (navMenu) {
            navMenu.classList.add('menu-loading-animation');
          }
          
          // 2. Сразу добавляем финальный класс section-active, но с начальной позицией
          item.classList.add('section-active', 'section-active-loading');
          
          // 3. Принудительно применяем стили (reflow)
          item.offsetHeight;
          
          // 4. Через небольшую задержку убираем класс начальной позиции
          setTimeout(() => {
            item.classList.remove('section-active-loading');
            console.log('  Анимация завершена');
          }, 50);
          
          // 5. Возвращаем обычное время перехода
          setTimeout(() => {
            if (navMenu) {
              navMenu.classList.remove('menu-loading-animation');
            }
            console.log('  Время перехода возвращено к стандартному');
          }, 650);
          
          found = true;
        }
      });
      
      if (!found) {
        console.log(`  ✗ Не найден пункт меню для раздела: ${sectionPath}`);
      }
    }
  });
  
  // Дополнительная проверка
  setTimeout(() => {
    const activeItems = document.querySelectorAll('.menu_item.section-active');
    console.log('\nЭлементы с классом section-active:', activeItems.length);
    activeItems.forEach((item, index) => {
      const href = item.getAttribute('href');
      const text = item.textContent.trim();
      console.log(`Активный элемент ${index}: "${text}" → ${href}`);
    });
  }, 800);
});
