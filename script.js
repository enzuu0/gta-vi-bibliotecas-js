'use strict';

// Dois estilos visuais; a escolha permanece no navegador do visitante.
const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
function setTheme(theme) {
  const choice = theme === 'dark' ? 'dark' : 'vice-city';
  document.documentElement.dataset.theme = choice;
  themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice)));
  document.querySelector('meta[name="theme-color"]').setAttribute('content', choice === 'dark' ? '#0b0e14' : '#171126');
  try { localStorage.setItem('gta-vi-theme', choice); } catch (e) { /* Navegação privada pode impedir armazenamento. */ }
}
themeButtons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
setTheme(document.documentElement.dataset.theme);

// AOS: anima os elementos marcados com data-aos quando entram na tela.
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 750, once: true, offset: 80, disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches });
}

// Swiper: transforma o HTML da galeria em um carrossel navegável.
if (typeof Swiper !== 'undefined') {
  new Swiper('.gallery', {
    loop: true,
    slidesPerView: 1,
    spaceBetween: 0,
    keyboard: { enabled: true, onlyInViewport: true },
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.gallery-next', prevEl: '.gallery-prev' },
    a11y: { enabled: true, prevSlideMessage: 'Imagem anterior', nextSlideMessage: 'Próxima imagem' }
  });
} else {
  // Mensagem discreta se o CDN estiver indisponível, sem deixar botões inertes.
  document.querySelectorAll('.gallery-prev, .gallery-next').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('.gallery-note').textContent = 'Conecte-se à internet para carregar a biblioteca Swiper e usar a galeria.';
    });
  });
}

// canvas-confetti: o clique no botão chama uma função pronta da biblioteca.
const celebrate = document.querySelector('#celebrate');
const feedback = document.querySelector('#feedback');
celebrate.addEventListener('click', () => {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 130, spread: 80, origin: { y: 0.66 }, colors: ['#ff886d', '#ef5c9e', '#72d5e8', '#ffe2a3'] });
    feedback.textContent = 'Confetes ativados com canvas-confetti!';
  } else {
    feedback.textContent = 'Conecte-se à internet para carregar canvas-confetti e ver o efeito.';
  }
});
