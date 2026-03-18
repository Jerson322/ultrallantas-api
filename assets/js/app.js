/* =====================================================
     1. LOADER / PANTALLA DE CARGA
  ===================================================== */

let progreso = 0;
let barra = document.getElementById("barra");

let intervalo = setInterval(() => {
  progreso += 5;
  barra.style.width = progreso + "%";

  if (progreso >= 100) {
    clearInterval(intervalo);

    document.getElementById("loader").style.opacity = "0";

    setTimeout(() => {
      document.getElementById("loader").style.display = "none";
      document.getElementById("contenido").classList.remove("hidden");
    }, 500);
  }
}, 120);

/* =====================================================
     2. MENÚ MÓVIL (CONSOLIDADO)
  ===================================================== */

const btnMenu = document.getElementById("btnMenu");
const menuMobile = document.getElementById("menuMobile");

if (btnMenu && menuMobile) {
  btnMenu.addEventListener("click", () => {
    menuMobile.classList.toggle("hidden");
  });
}

/* =====================================================
     4. HEADER DINÁMICO EN SCROLL
  ===================================================== */

window.addEventListener("scroll", function () {
  let header = document.getElementById("header");

  if (window.scrollY > 80) {
    header.classList.add("header-compact");
  } else {
    header.classList.remove("header-compact");
  }
});

/* =====================================================
     5. CARRUSEL DE PRODUCTOS (SWIPER)
  ===================================================== */

const swiper = new Swiper(".premiumSwiper", {
  effect: "coverflow",

  grabCursor: true,
  centeredSlides: true,
  slidesPerView: "auto",

  spaceBetween: 30,

  initialSlide: 3,

  observer: true,
  observeParents: true,

  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 120,
    modifier: 1.3,
    slideShadows: false,
  },

  loop: true,

  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
  },

  speed: 900,
});

// //* =====================================================
//      5. Filtrado inteligente
// ===================================================== *//

document.addEventListener("DOMContentLoaded", () => {
  const tires = [
    { width: 110, profile: 70, diameter: 17 },
    { width: 120, profile: 70, diameter: 17 },
    { width: 120, profile: 70, diameter: 18 },
    { width: 130, profile: 70, diameter: 17 },
    { width: 140, profile: 70, diameter: 17 },
    { width: 150, profile: 60, diameter: 17 },
    { width: 150, profile: 60, diameter: 18 },
    { width: 180, profile: 55, diameter: 17 },
    { width: 180, profile: 55, diameter: 18 },
  ];

  const ancho = document.getElementById("ancho");
  const perfil = document.getElementById("perfil");
  const diametro = document.getElementById("diametro");

  function uniqueValues(array, key) {
    return [...new Set(array.map((item) => item[key]))];
  }

  /* CARGAR ANCHOS */

  function loadAncho() {
    uniqueValues(tires, "width").forEach((v) => {
      ancho.innerHTML += `<option value="${v}">${v}</option>`;
    });
  }

  loadAncho();

  /* FILTRAR PERFIL */

  ancho.addEventListener("change", () => {
    perfil.innerHTML = `<option value="">Perfil</option>`;
    diametro.innerHTML = `<option value="">Diámetro</option>`;

    const filtered = tires.filter((t) => t.width == ancho.value);

    uniqueValues(filtered, "profile").forEach((v) => {
      perfil.innerHTML += `<option value="${v}">${v}</option>`;
    });
  });

  /* FILTRAR DIAMETRO */

  perfil.addEventListener("change", () => {
    diametro.innerHTML = `<option value="">Diámetro</option>`;

    const filtered = tires.filter(
      (t) => t.width == ancho.value && t.profile == perfil.value,
    );

    uniqueValues(filtered, "diameter").forEach((v) => {
      diametro.innerHTML += `<option value="${v}">${v}</option>`;
    });
  });
});

/* animacion scroll seccion premium */

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  for (let i = 0; i < reveals.length; i++) {
    const windowHeight = window.innerHeight;
    const elementTop = reveals[i].getBoundingClientRect().top;
    const elementVisible = 120;

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}

window.addEventListener("scroll", revealOnScroll);

async function cargarCategorias() {
  try {
    const res = await fetch("http://localhost:3000/categorias");
    const data = await res.json();

    const desktop = document.getElementById("submenuCategoriasDesktop");
    const mobile = document.getElementById("submenuCategoriasMobile");

    desktop.innerHTML = "";
    mobile.innerHTML = "";

    data.categorias.forEach((cat) => {
      // DESKTOP
      const liDesktop = document.createElement("li");
      liDesktop.textContent = cat;
      liDesktop.className = "cursor-pointer hover:text-red-500 py-1";
      desktop.appendChild(liDesktop);

      // MOBILE
      const liMobile = document.createElement("li");
      liMobile.textContent = cat;
      liMobile.className = "cursor-pointer hover:text-white";
      mobile.appendChild(liMobile);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

// ==========================
// TOGGLE MOBILE
// ==========================
document.getElementById("btnCategoriasMobile").addEventListener("click", () => {
  const menu = document.getElementById("submenuCategoriasMobile");
  menu.classList.toggle("hidden");
});

// ==========================
// INICIAR
// ==========================
cargarCategorias();
