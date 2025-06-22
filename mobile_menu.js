document.addEventListener('DOMContentLoaded', function() {
  const trigger = document.querySelector('.menu-trigger');
  const overlay = document.querySelector('.menu-overlay');
  trigger.addEventListener('click', function() {
    overlay.classList.toggle('open');
  });
});
