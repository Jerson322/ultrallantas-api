document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
       1. LOADER / PANTALLA DE CARGA
  ===================================================== */

  let progreso = 0;
  const barra = document.getElementById("barra");

  const intervalo = setInterval(() => {
    progreso += 5;

    if (barra) {
      barra.style.width = progreso + "%";
    }

    if (progreso >= 100) {
      clearInterval(intervalo);

      const loader = document.getElementById("loader");
      const contenido = document.getElementById("contenido");

      if (loader) loader.style.opacity = "0";

      setTimeout(() => {
        if (loader) loader.style.display = "none";
        if (contenido) contenido.classList.remove("hidden");
      }, 500);
    }
  }, 120);

  /* =====================================================
       2. MENÚ MÓVIL
  ===================================================== */

  const btnMenu = document.getElementById("btnMenu");
  const menuMobile = document.getElementById("menuMobile");

  if (btnMenu && menuMobile) {
    btnMenu.addEventListener("click", () => {
      menuMobile.classList.toggle("hidden");
    });
  }

  /* =====================================================
       3. HEADER DINÁMICO
  ===================================================== */

  window.addEventListener("scroll", () => {
    const header = document.getElementById("header");

    if (!header) return;

    if (window.scrollY > 80) {
      header.classList.add("header-compact");
    } else {
      header.classList.remove("header-compact");
    }
  });

  /* =====================================================
       4. CARRUSEL (SWIPER)
  ===================================================== */

  if (typeof Swiper !== "undefined") {
    new Swiper(".premiumSwiper", {
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
  }

  /* =====================================================
       5. FILTRO INTELIGENTE
  ===================================================== */

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

  if (ancho && perfil && diametro) {
    // CARGAR ANCHO
    uniqueValues(tires, "width").forEach((v) => {
      ancho.innerHTML += `<option value="${v}">${v}</option>`;
    });

    // FILTRAR PERFIL
    ancho.addEventListener("change", () => {
      perfil.innerHTML = `<option value="">Perfil</option>`;
      diametro.innerHTML = `<option value="">Diámetro</option>`;

      const filtered = tires.filter((t) => t.width == ancho.value);

      uniqueValues(filtered, "profile").forEach((v) => {
        perfil.innerHTML += `<option value="${v}">${v}</option>`;
      });
    });

    // FILTRAR DIÁMETRO
    perfil.addEventListener("change", () => {
      diametro.innerHTML = `<option value="">Diámetro</option>`;

      const filtered = tires.filter(
        (t) => t.width == ancho.value && t.profile == perfil.value,
      );

      uniqueValues(filtered, "diameter").forEach((v) => {
        diametro.innerHTML += `<option value="${v}">${v}</option>`;
      });
    });
  }

  /* =====================================================
       6. ANIMACIÓN SCROLL
  ===================================================== */

  const reveals = document.querySelectorAll(".reveal");

  function revealOnScroll() {
    reveals.forEach((el) => {
      const windowHeight = window.innerHeight;
      const elementTop = el.getBoundingClientRect().top;
      const elementVisible = 120;

      if (elementTop < windowHeight - elementVisible) {
        el.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);

  /* =====================================================
       7. CATEGORÍAS DESDE API
  ===================================================== */

  async function cargarCategorias() {
    try {
      const res = await fetch(
        "https://ultrallantas-api.onrender.com/categorias",
      );
      const data = await res.json();

      const desktop = document.getElementById("submenuCategoriasDesktop");
      const mobile = document.getElementById("submenuCategoriasMobile");

      if (!desktop || !mobile) return;

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
        liMobile.className = "cursor-pointer hover:text-white py-1";
        mobile.appendChild(liMobile);
      });
    } catch (error) {
      console.error("Error cargando categorias:", error);
    }
  }

  const btnCategoriasMobile = document.getElementById("btnCategoriasMobile");

  if (btnCategoriasMobile) {
    btnCategoriasMobile.addEventListener("click", () => {
      const menu = document.getElementById("submenuCategoriasMobile");
      if (menu) menu.classList.toggle("hidden");
    });
  }

  cargarCategorias();
});
