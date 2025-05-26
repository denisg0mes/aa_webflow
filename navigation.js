document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const menuItems = document.querySelectorAll('.menu_item a');
  
  // Определяем только родительские разделы (главные страницы)
  const sections = [
    '/projects',
    '/explorations',
    '/about', 
    '/services',
    '/collection'
  ];
  
  // Проверяем каждый раздел
  sections.forEach(sectionPath => {
    // Проверяем, начинается ли текущий путь с пути раздела
    if (currentPath.startsWith(sectionPath + '/') || currentPath === sectionPath) {
      
      // Если это точное совпадение - не добавляем класс (Webflow сам добавит w--current)
      if (currentPath === sectionPath) {
        return;
      }
      
      // Если это вложенная страница - ищем соответствующий пункт меню
      menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === sectionPath) {
          item.closest('.menu_item').classList.add('section-active');
        }
      });
    }
  });
});
