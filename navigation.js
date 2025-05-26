document.addEventListener('DOMContentLoaded', function() {
  console.log('Скрипт загружен');
  
  const currentPath = window.location.pathname;
  console.log('Текущий путь:', currentPath);
  
  // Находим меню и сразу отключаем transition
  const navMenu = document.querySelector('.nav_menu');
  
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
  
  let foundActiveSection = false;
  
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
      menuItems.forEach((item, index) => {
        const href = item.getAttribute('href');
        console.log(`  Проверяем пункт ${index}: "${href}" === "${sectionPath}"?`, href === sectionPath);
        
        if (href === sectionPath) {
          console.log('  ✓ Пункт меню найден, запускаем анимацию');
          foundActiveSection = true;
          
          // ===== АНИМАЦИЯ ЗАГРУЗКИ =====
          
          // 1. Ставим пункт в начальное состояние (как активный)
          item.classList.add('section-active', 'section-active-start');
          
          // 2. Даем браузеру время отрендерить начальное состояние
          requestAnimationFrame(() => {
            // 3. Включаем анимацию и убираем начальное состояние
            if (navMenu) {
              navMenu.classList.add('js-animating');
            }
            
            requestAnimationFrame(() => {
              item.classList.remove('section-active-start');
              console.log('  Анимация запущена');
              
              // 4. Убираем класс анимации через время анимации
              setTimeout(() => {
                if (navMenu) {
                  navMenu.classList.remove('js-animating');
                  navMenu.classList.add('js-ready');
                }
                console.log('  Анимация завершена');
              }, 800);
            });
          });
        }
      });
    }
  });
  
  // Если не нашли активного раздела, просто включаем обычные стили
  if (!foundActiveSection) {
    setTimeout(() => {
      if (navMenu) {
        navMenu.classList.add('js-ready');
      }
      console.log('Обычное меню готово');
    }, 100);
  }
  
  // Дополнительная проверка
  setTimeout(() => {
    const activeItems = document.querySelectorAll('.menu_item.section-active');
    console.log('\nЭлементы с классом section-active:', activeItems.length);
    activeItems.forEach((item, index) => {
      const href = item.getAttribute('href');
      const text = item.textContent.trim();
      console.log(`Активный элемент ${index}: "${text}" → ${href}`);
    });
  }, 1000);
});
