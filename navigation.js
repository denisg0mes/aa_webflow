document.addEventListener('DOMContentLoaded', function() {
  const currentPath = window.location.pathname;
  const menuItems = document.querySelectorAll('.menu_item a');
  
  // Определяем родительские разделы и их пути
  const sections = {
    'projects': ['/projects', '/project/'], // все страницы проектов
    'explorations': ['/explorations', '/exploration/'], // все страницы проектов
    'about': ['/about', '/team/', '/history/'], // все страницы о компании
    'services': ['/services', '/service/'] // все страницы услуг
  };
  
  // Проверяем, в каком разделе находимся
  for (let sectionName in sections) {
    const sectionPaths = sections[sectionName];
    
    for (let path of sectionPaths) {
      if (currentPath.includes(path)) {
        // Добавляем класс к соответствующему пункту меню
        menuItems.forEach(item => {
          const href = item.getAttribute('href');
          if (href && href.includes(sectionPaths[0])) {
            item.closest('.menu_item').classList.add('section-active');
          }
        });
        break;
      }
    }
  }
});
