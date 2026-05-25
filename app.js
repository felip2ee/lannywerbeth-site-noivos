/**
 * Lanny & Werbeth Wedding Site JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCountdown();
  initSlider();
  initGifts();
  initRSVP();
  initFloatingConfirm();
  trackVisitor();
});

// ==========================================
// Cookie Utilities
// ==========================================
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const val = `; ${document.cookie}`;
  const parts = val.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

// ==========================================
// 1. Navigation & Mobile Menu
// ==========================================
function initNavigation() {
  const navbar = document.getElementById('main-navbar');
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu-list');
  const navLinks = document.querySelectorAll('.nav-item a');

  // Change navbar appearance on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    highlightNavOnScroll();
  });

  // Mobile menu toggle
  toggleBtn.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close mobile menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      toggleBtn.classList.remove('active');
      navMenu.classList.remove('active');
      
      // Smooth scroll adjustment for fixed header
      const targetId = link.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 70;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // Highlight navigation item on scroll
  function highlightNavOnScroll() {
    const scrollPos = window.scrollY + 100;
    const sections = ['home-scroll', 'casal', 'eventos', 'presentes', 'rsvp'];
    
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop - 70;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
          const activeLink = document.querySelector(`.nav-item a[href="#${id === 'home-scroll' ? 'home-scroll' : id}"]`);
          if (activeLink) {
            activeLink.parentElement.classList.add('active');
          }
        }
      }
    });
  }
}

// ==========================================
// 1b. Floating Confirm Button
// ==========================================
function initFloatingConfirm() {
  const btn = document.getElementById('floating-confirm-dot');
  const hero = document.getElementById('home-scroll');
  if (!btn || !hero) return;

  function updateFloating() {
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    if (window.scrollY > heroBottom * 0.4) {
      btn.classList.add('is-floating');
    } else {
      btn.classList.remove('is-floating');
    }
  }

  window.addEventListener('scroll', updateFloating, { passive: true });
  updateFloating();
}

// ==========================================
// 2. Countdown Timer
// ==========================================
function initCountdown() {
  // Wedding Date: August 8, 2026 at 16:30
  const targetDate = new Date('2026-08-08T16:30:00-03:00').getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      document.getElementById('wedding-countdown').innerHTML = '<h3 class="cursive-text">Chegou o Grande Dia! ❤️</h3>';
      clearInterval(timerInterval);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById('countdown-days').innerText = String(days).padStart(2, '0');
    document.getElementById('countdown-hours').innerText = String(hours).padStart(2, '0');
    document.getElementById('countdown-minutes').innerText = String(minutes).padStart(2, '0');
    document.getElementById('countdown-seconds').innerText = String(seconds).padStart(2, '0');
  }

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

// ==========================================
// 3. Image Slider
// ==========================================
function initSlider() {
  const slides = document.querySelectorAll('.couple-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const prevBtn = document.getElementById('slider-btn-prev');
  const nextBtn = document.getElementById('slider-btn-next');
  let currentIndex = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    currentIndex = (index + slides.length) % slides.length;
    slides[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
  }

  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
  }

  // Auto transition
  function startAutoSlide() {
    slideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
  }

  nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
  });

  prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
      resetAutoSlide();
    });
  });

  startAutoSlide();
}

// ==========================================
// 4. Gifts List, Search, and Modals
// ==========================================
const ALL_GIFTS = [
  { id: 1, name: "Panela de arroz elétrica gourmet dos recém-casados", category: "cozinha", price: 279.00, image: "images/panela_arroz.webp", link: "https://pay.cakto.com.br/z2fcgt7_898548" },
  { id: 2, name: "Jogo de fondue para noites românticas e fofocas", category: "cozinha", price: 300.00, image: "images/fondue.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 3, name: "Jogo de toalhas premium para o pós-lua de mel", category: "decor", price: 250.00, image: "images/toalhas.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 4, name: "Kit colcha queen digno de hotel cinco estrelas", category: "decor", price: 350.00, image: "images/colcha.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 5, name: "Aspirador de pó para sugar as brigas do casamento", category: "eletro", price: 300.00, image: "images/aspirador.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 6, name: "Pipoqueira elétrica para sessões infinitas de filme", category: "eletro", price: 250.00, image: "images/pipoqueira.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 7, name: "Vale passeio extra da lua de mel", category: "lua-de-mel", price: 350.00, image: "images/vale_passeio.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 8, name: "Air fryer oficial da preguiça gourmet", category: "eletro", price: 400.00, image: "images/air_fryer.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 9, name: "Sanduicheira dos cafés da manhã apaixonados", category: "eletro", price: 250.00, image: "images/sanduicheira.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 10, name: "Kit tapetes de banheiro anti-tombo conjugal", category: "decor", price: 279.00, image: "images/tapete_banheiro.webp", link: "https://pay.cakto.com.br/z2fcgt7_898548" },
  { id: 11, name: "Vale-presente para os noivos gastarem sem culpa", category: "decor", price: 300.00, image: "images/vale_presente.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 12, name: "Kit facas para cortar cebola e fofoca", category: "cozinha", price: 250.00, image: "images/kit_facas.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 13, name: "Escorredor de louças do lar feliz", category: "cozinha", price: 250.00, image: "images/escorredor_loucas.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 14, name: "Jogo de jantar para impressionar as visitas", category: "cozinha", price: 350.00, image: "images/jogo_jantar.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 15, name: "Cartão presente “os noivos agradecem”", category: "decor", price: 250.00, image: "images/cartao_agradecem.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 16, name: "Cartão presente versão premium", category: "decor", price: 400.00, image: "images/cartao_premium.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 17, name: "Ajude os noivos a pagarem um boletinho", category: "lua-de-mel", price: 350.00, image: "images/boletinho.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 18, name: "Taxa para a noiva jogar o buquê na sua direção", category: "decor", price: 250.00, image: "images/jogar_buque.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 19, name: "Taxa anti-buquê para proteger sua namorada", category: "decor", price: 300.00, image: "images/anti_buque.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 20, name: "Cota para perguntar quando virão os filhos", category: "decor", price: 350.00, image: "images/quando_filhos.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 21, name: "Primeiro lugar na fila do buffet", category: "cozinha", price: 250.00, image: "images/fila_buffet.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 22, name: "Cota da primeira DR do casal", category: "decor", price: 300.00, image: "images/primeira_dr.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 23, name: "Ajuda para manter a geladeira cheia", category: "cozinha", price: 450.00, image: "images/geladeira_cheia.webp", link: "https://pay.cakto.com.br/qxahajg_898606" },
  { id: 24, name: "Patrocine o cafézinho dos noivos", category: "cozinha", price: 250.00, image: "images/cafezinho.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 25, name: "Vale sushi depois da discussão", category: "cozinha", price: 300.00, image: "images/sushi.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 26, name: "Presenteie o noivo com um jogo GTA 6", category: "decor", price: 300.00, image: "images/gta6.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 27, name: "Ajude na gasolina da lua de mel", category: "lua-de-mel", price: 400.00, image: "images/gasolina.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 28, name: "Vale um final de semana sem lavar louça", category: "cozinha", price: 279.00, image: "images/sem_lavar_louca.webp", link: "https://pay.cakto.com.br/z2fcgt7_898548" },
  { id: 29, name: "Fundo emergencial do iFood", category: "cozinha", price: 300.00, image: "images/ifood.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" },
  { id: 30, name: "Cota do “amor eterno enquanto dura a reforma”", category: "decor", price: 400.00, image: "images/amor_reforma.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 31, name: "Ajuda para os móveis parcelados em 48x", category: "decor", price: 450.00, image: "images/moveis_parcelados.webp", link: "https://pay.cakto.com.br/qxahajg_898606" },
  { id: 32, name: "Taxa para ouvir a história do pedido de casamento", category: "decor", price: 250.00, image: "images/pedido_casamento.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 33, name: "Vale date romântico patrocinado por você", category: "decor", price: 400.00, image: "images/date_romantico.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 34, name: "Cota do churrasco na casa dos noivos", category: "cozinha", price: 350.00, image: "images/churrasco.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 35, name: "Patrocínio oficial do bar da casa", category: "cozinha", price: 600.00, image: "images/bar_casa.webp", link: "https://pay.cakto.com.br/k2ns5d3_898607" },
  { id: 36, name: "Vale uma noite sem ronco", category: "decor", price: 250.00, image: "images/sem_ronco.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 37, name: "Fundo para terapia de casal preventiva", category: "decor", price: 400.00, image: "images/terapia_casal.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 38, name: "Ajuda para manter o ar-condicionado ligado no calor", category: "eletro", price: 350.00, image: "images/ar_condicionado.webp", link: "https://pay.cakto.com.br/oqnevvi_898586" },
  { id: 39, name: "Cota “não leva tupperware embora”", category: "cozinha", price: 250.00, image: "images/tupperware.webp", link: "https://pay.cakto.com.br/39pydpf_898535" },
  { id: 40, name: "Taxa para escolher música no churrasco dos noivos", category: "cozinha", price: 279.00, image: "images/musica_churrasco.webp", link: "https://pay.cakto.com.br/z2fcgt7_898548" },
  { id: 41, name: "Ajude o noivo comprar um Ps5", category: "decor", price: 400.00, image: "images/ps5.webp", link: "https://pay.cakto.com.br/9bvwwmc_898605" },
  { id: 42, name: "Presenteie o noivo com um jogo de GTA", category: "decor", price: 300.00, image: "images/gta6.webp", link: "https://pay.cakto.com.br/fzxa4py_898576" }
];

let filteredGifts = [...ALL_GIFTS];
let selectedGift = null;

const GIFTS_PAGE_SIZE = 8;

function initGifts() {
  const grid = document.getElementById('gifts-cards-grid');
  const searchInput = document.getElementById('gift-search-input');
  const categoryFilter = document.getElementById('gift-category-filter');
  const loadMoreContainer = document.getElementById('gifts-load-more-container');
  const loadMoreBtn = document.getElementById('btn-gifts-load-more');

  let giftsExpanded = false;

  function renderGifts() {
    grid.innerHTML = '';

    if (filteredGifts.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px 0;">Nenhum presente encontrado para a busca ou filtro selecionado.</div>';
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      return;
    }

    const visibleGifts = giftsExpanded ? filteredGifts : filteredGifts.slice(0, GIFTS_PAGE_SIZE);

    visibleGifts.forEach(gift => {
      const card = document.createElement('div');
      card.className = 'gift-card';
      card.innerHTML = `
        <div class="gift-image-wrapper">
          <img src="${gift.image}" alt="${gift.name}" onerror="this.onerror=null; this.src='images/coracao.png';">
        </div>
        <div class="gift-category">${getCategoryLabel(gift.category)}</div>
        <h4 class="gift-name">${gift.name}</h4>
        <div class="gift-price">R$ ${gift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <button class="btn btn-primary btn-full gift-btn-select" data-id="${gift.id}">
          <i class="fa fa-gift"></i> Presentear
        </button>
      `;
      grid.appendChild(card);
    });

    // Mostrar "ver mais" apenas se ainda não expandiu e há mais itens
    if (loadMoreContainer) {
      loadMoreContainer.style.display =
        (!giftsExpanded && filteredGifts.length > GIFTS_PAGE_SIZE) ? 'flex' : 'none';
    }

    document.querySelectorAll('.gift-btn-select').forEach(btn => {
      btn.addEventListener('click', () => {
        const giftId = parseInt(btn.getAttribute('data-id'));
        const gift = ALL_GIFTS.find(g => g.id === giftId);
        if (gift) openGiftModal(gift);
      });
    });
  }

  function getCategoryLabel(cat) {
    switch (cat) {
      case 'lua-de-mel': return 'Lua de Mel';
      case 'cozinha': return 'Cozinha & Mesa';
      case 'eletro': return 'Eletrodomésticos';
      case 'decor': return 'Móveis & Decoração';
      default: return 'Geral';
    }
  }

  function filterGifts() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const catVal = categoryFilter.value;
    filteredGifts = ALL_GIFTS.filter(gift => {
      const matchesSearch = gift.name.toLowerCase().includes(searchVal);
      const matchesCategory = (catVal === 'all' || gift.category === catVal);
      return matchesSearch && matchesCategory;
    });
    renderGifts();
  }

  // "Ver mais" abre apenas uma vez — botão some após o clique
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      giftsExpanded = true;
      renderGifts();
    });
  }

  // Modal de presente
  const giftModal = document.getElementById('gift-modal');
  const giftForm = document.getElementById('gift-message-form');
  const closeGiftBtn = document.getElementById('btn-close-gift-modal');

  function closeGiftModal() {
    giftModal.classList.remove('active');
    document.body.style.overflow = '';
    giftForm.reset();
    selectedGift = null;
  }

  closeGiftBtn.addEventListener('click', closeGiftModal);
  giftModal.addEventListener('click', (e) => {
    if (e.target === giftModal) closeGiftModal();
  });

  giftForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedGift) return;

    const senderName = document.getElementById('gift-sender-name').value.trim();
    const senderMsg = document.getElementById('gift-sender-message').value.trim();

    const clickRecord = {
      name: senderName,
      message: senderMsg,
      giftName: selectedGift.name,
      giftValue: selectedGift.price,
      timestamp: new Date().toISOString(),
      isGift: true
    };
    const currentRSVP = JSON.parse(localStorage.getItem('lw_rsvp') || '[]');
    currentRSVP.push(clickRecord);
    localStorage.setItem('lw_rsvp', JSON.stringify(currentRSVP));

    window.open(selectedGift.link, '_blank');
    closeGiftModal();
  });

  searchInput.addEventListener('input', filterGifts);
  categoryFilter.addEventListener('change', filterGifts);
  renderGifts();
}

function openGiftModal(gift) {
  selectedGift = gift;
  document.getElementById('modal-gift-name').textContent = gift.name;
  document.getElementById('modal-gift-price').textContent =
    `R$ ${gift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.getElementById('modal-gift-image').src = gift.image;

  // Pré-preenche nome se a pessoa já confirmou o convite via cookie
  const confirmedGuest = getCookie('lw_confirmed_guest');
  if (confirmedGuest) {
    try {
      const guest = JSON.parse(confirmedGuest);
      const nameInput = document.getElementById('gift-sender-name');
      if (guest.name && !nameInput.value) nameInput.value = guest.name;
    } catch (e) {}
  }

  document.getElementById('gift-modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// ==========================================
// 5. RSVP Confirmation Form
// ==========================================
function initRSVP() {
  const rsvpForm = document.getElementById('rsvp-wedding-form');
  const phoneInput = document.getElementById('rsvp-phone');

  // Simple mask for phone number (Brazilian layout)
  phoneInput.addEventListener('input', () => {
    let value = phoneInput.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 10) {
      phoneInput.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 5) {
      phoneInput.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else if (value.length > 2) {
      phoneInput.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      phoneInput.value = `(${value.slice(0)}`;
    }
  });

  // Form submission
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('rsvp-name').value.trim();
    const email = document.getElementById('rsvp-email').value.trim();
    const phone = document.getElementById('rsvp-phone').value.trim();
    const attendingVal = document.getElementById('rsvp-attending').value;
    const guests = parseInt(document.getElementById('rsvp-guests').value);
    const message = document.getElementById('rsvp-message').value.trim();

    if (!name || !email || !phone || !attendingVal) return;

    const isAttending = attendingVal === 'yes';

    // Save record to localStorage
    const rsvpRecord = {
      name,
      email,
      phone,
      guests: isAttending ? guests : 0,
      message: isAttending ? message : '[NÃO COMPARECERÁ] ' + message,
      timestamp: new Date().toISOString(),
      isGift: false,
      giftName: null,
      giftValue: 0,
      attending: isAttending
    };

    const currentRSVP = JSON.parse(localStorage.getItem('lw_rsvp') || '[]');
    currentRSVP.push(rsvpRecord);
    localStorage.setItem('lw_rsvp', JSON.stringify(currentRSVP));
    saveRSVPToSupabase(rsvpRecord);

    // Salva cookie para identificar este convidado em outras ações (ex: presentear)
    setCookie('lw_confirmed_guest', JSON.stringify({ name, phone }), 365);

    // Reset Form
    rsvpForm.reset();

    // Show Success Modal
    showSuccessModalFn(
      'Tudo certo!',
      isAttending 
        ? 'Já recebemos a sua confirmação. Muito obrigado por fazer parte deste dia especial com a gente! 😉'
        : 'Sua resposta foi registrada. Sentiremos sua falta no evento, mas agradecemos por nos avisar! ❤️'
    );
  });
}

// ==========================================
// 6. Success Modal Utility
// ==========================================
function showSuccessModalFn(title, htmlContent) {
  const successModal = document.getElementById('success-modal');
  const successTitle = document.getElementById('success-modal-title');
  const successText = document.getElementById('success-modal-text');
  const successClose = document.getElementById('btn-close-success-modal');
  const successBtn = document.getElementById('btn-success-close');

  successTitle.innerText = title;
  successText.innerHTML = htmlContent;

  successModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  const closeFn = () => {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  successClose.onclick = closeFn;
  successBtn.onclick = closeFn;
  successModal.onclick = (e) => {
    if (e.target === successModal) closeFn();
  };
}

// ==========================================
// 7. Visitor Tracking
// ==========================================
function trackVisitor() {
  // Prevent duplicate logs in the same session
  if (sessionStorage.getItem('lw_tracked_session')) return;

  const userAgent = navigator.userAgent;
  const referrer = document.referrer || 'Acesso Direto';
  const screenSize = `${window.innerWidth}x${window.innerHeight}`;
  
  // Categorize device based on screen size
  let device = 'Desktop';
  if (window.innerWidth <= 768) {
    device = 'Mobile';
  } else if (window.innerWidth <= 992) {
    device = 'Tablet';
  }

  // Parse basic browser from user agent
  let browser = 'Outro';
  if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) browser = 'Safari';
  else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';

  const visitorRecord = {
    timestamp: new Date().toISOString(),
    userAgent,
    referrer,
    screenSize,
    device,
    browser
  };

  const currentVisitors = JSON.parse(localStorage.getItem('lw_visitors') || '[]');
  currentVisitors.push(visitorRecord);
  localStorage.setItem('lw_visitors', JSON.stringify(currentVisitors));
  saveVisitorToSupabase(visitorRecord);

  sessionStorage.setItem('lw_tracked_session', 'true');
}

async function saveRSVPToSupabase(record) {
  try {
    const { error } = await sbClient.from('rsvp').insert({
      submitted_at: record.timestamp,
      name:         record.name,
      email:        record.email,
      phone:        record.phone,
      attending:    record.attending,
      guests:       record.guests,
      message:      record.message,
      is_gift:      record.isGift,
      gift_name:    record.giftName,
      gift_value:   record.giftValue,
    });
    if (error) console.warn('Supabase RSVP:', error.message);
  } catch (e) {
    console.warn('Supabase indisponível:', e.message);
  }
}

async function saveVisitorToSupabase(record) {
  try {
    const { error } = await sbClient.from('visitors').insert({
      submitted_at: record.timestamp,
      user_agent:   record.userAgent,
      referrer:     record.referrer,
      screen_size:  record.screenSize,
      device:       record.device,
      browser:      record.browser,
    });
    if (error) console.warn('Supabase visitors:', error.message);
  } catch (e) {
    console.warn('Supabase indisponível:', e.message);
  }
}
