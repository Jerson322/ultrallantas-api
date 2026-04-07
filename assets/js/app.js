document.addEventListener("DOMContentLoaded", () => {
  const API = "https://ultrallantas-api.onrender.com";

  // Despertar servidor inmediatamente
  fetch(`${API}/categorias`, { cache: "force-cache" });
  // ping para "despertar" API antes
  fetch(`${API}/productos`)
    .then((res) => {
      console.log("RESPUESTA RAW:", res); // 👈 SI ESTO NO SALE → NO LLEGA
      return res.json();
    })
    .then((data) => {
      console.log("DATA COMPLETA:", data); // 👈 AQUÍ VERÁS TODO

      const lista = data.resultados || data.productos || data.data || [];

      console.log("LISTA DETECTADA:", lista); // 👈 CLAVE

      const productos = lista.filter((p) => {
        const stockTotal =
          p.inventory?.reduce((acc, i) => acc + (i.inventory || 0), 0) || 0;
        return stockTotal > 0;
      });

      console.log("PRODUCTOS FILTRADOS:", productos); // 👈 ESTE ES TU LOG

      localStorage.setItem("productos_cache", JSON.stringify(productos));
      localStorage.setItem("productos_time", Date.now());

      console.log("⚡ Cache global lista");
    })
    .catch((err) => {
      console.error("ERROR FETCH:", err); // 👈 SI FALLA
    });
  const entrarDirectoCategoria =
    window.location.pathname.includes("producto-categoria");
  /* =====================================================
       1. LOADER / PANTALLA DE CARGA
  ===================================================== */
  let progreso = 0;
  const barra = document.getElementById("barra");

  const velocidadLoader = entrarDirectoCategoria ? 40 : 120;

  const intervalo = setInterval(() => {
    progreso += 5;

    if (barra) barra.style.width = progreso + "%";

    if (progreso >= 100) {
      clearInterval(intervalo);

      const loader = document.getElementById("loader");
      const contenido = document.getElementById("contenido");

      if (loader) loader.style.opacity = "0";

      setTimeout(() => {
        if (loader) loader.style.display = "none";
        if (contenido) contenido.classList.remove("hidden");

        // abrir categoría si viene desde URL
        if (entrarDirectoCategoria) {
          detectarCategoriaDesdeURL();
        }
      }, 300);
    }
  }, velocidadLoader);
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
  function cargarFiltrosLlantas(productos) {
    const anchos = new Set();
    const perfiles = new Set();
    const diametros = new Set();

    productos.forEach((p) => {
      if (p.heigh) anchos.add(p.heigh);
      if (p.width) perfiles.add(p.width);
      if (p.depth) diametros.add(p.depth);
    });

    llenarTodosLosSelect("ancho", anchos);
    llenarTodosLosSelect("perfil", perfiles);
    llenarTodosLosSelect("diametro", diametros);
  }

  function llenarTodosLosSelect(id, valores) {
    const selects = document.querySelectorAll(`#${id}`);

    selects.forEach((select) => {
      select.innerHTML = '<option value="">Todos</option>';

      [...valores]
        .sort((a, b) => a - b)
        .forEach((valor) => {
          const option = document.createElement("option");
          option.value = valor;
          option.textContent = valor;
          select.appendChild(option);
        });
    });
  }

  async function precargarFiltrosLlantas() {
    try {
      const res = await fetch(`${API}/productos/categoria/LLANTAS`);
      const data = await res.json();

      const productos = data.productos || [];

      if (!productos.length) return;

      const anchos = new Set();
      const perfiles = new Set();
      const diametros = new Set();

      productos.forEach((p) => {
        if (p.heigh) anchos.add(p.heigh);
        if (p.width) perfiles.add(p.width);
        if (p.depth) diametros.add(p.depth);
      });

      // llenar filtros del inicio
      const anchoSelect = document.getElementById("ancho");
      const perfilSelect = document.getElementById("perfil");
      const diametroSelect = document.getElementById("diametro");

      llenarSelect(anchoSelect, anchos);
      llenarSelect(perfilSelect, perfiles);
      llenarSelect(diametroSelect, diametros);
    } catch (error) {
      console.log("Error cargando filtros del inicio");
    }
  }

  function llenarSelect(select, valores) {
    if (!select) return;

    select.innerHTML = '<option value="">Todos</option>';

    [...valores]
      .sort((a, b) => a - b)
      .forEach((valor) => {
        const option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
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
    const mobile = document.getElementById("submenuCategoriasMobile");
    const desktop = document.getElementById("submenuCategoriasDesktop");

    if (!mobile || !desktop) return;

    // 1️⃣ Intentar cargar desde cache primero
    const cache = localStorage.getItem("categorias_cache");

    if (cache) {
      const categorias = JSON.parse(cache);
      pintarCategorias(categorias, mobile, desktop);
    }

    // 2️⃣ Mientras tanto actualizar desde API en segundo plano
    try {
      const res = await fetch(`${API}/categorias`, {
        cache: "force-cache",
      });
      const data = await res.json();
      const categorias = data.categorias || [];

      // Guardar en cache
      localStorage.setItem("categorias_cache", JSON.stringify(categorias));

      pintarCategorias(categorias, mobile, desktop);
    } catch (error) {
      console.error("Error cargando categorias:", error);
    }
  }

  function pintarCategorias(categorias, mobile, desktop) {
    const grupos = {
      LLANTAS: ["LLANTAS"],
      MANTENIMIENTO: ["ACEITE", "REFRIGERANTE", "LUBRICANTES", "PASTILLAS"],
      PROTECCIÓN: [
        "SLIDERS DE MOTOR",
        "PROTECTOR EJE",
        "PROTECTOR RADIADOR",
        "PROTECTOR DE MOTOR",
        "SLIDER EJES",
      ],
      ACCESORIOS: [
        "ACCESORIOS",
        "ACCESORIOS DE LUJO PARA MOTO",
        "PISA PLACA",
        "FENDER ELIMINATOR",
        "MALETAS",
        "INTERCOMUNICADORES",
        "TULAS",
      ],
      EQUIPAMIENTO: [
        "GUANTES",
        "CHAQUETAS",
        "CASCOS",
        "GORRAS",
        "BOTAS",
        "RODILLERAS",
        "VISORES",
        "IMPERMEBALES",
        "GAFAS",
        "PANTALONES",
      ],
    };

    const fragMobile = document.createDocumentFragment();
    const fragDesktop = document.createDocumentFragment();

    for (const grupo in grupos) {
      let grupoAgregado = false;

      for (const cat of grupos[grupo]) {
        if (!categorias.includes(cat)) continue;

        if (!grupoAgregado) {
          const tituloMobile = document.createElement("li");
          tituloMobile.textContent = grupo;
          tituloMobile.className = "text-red-500 font-bold mt-3";
          fragMobile.appendChild(tituloMobile);

          const tituloDesktop = document.createElement("li");
          tituloDesktop.textContent = grupo;
          tituloDesktop.className = "text-red-500 font-bold mt-2";
          fragDesktop.appendChild(tituloDesktop);

          grupoAgregado = true;
        }

        const slug = cat
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-");

        const liMobile = document.createElement("li");
        liMobile.textContent = "• " + cat;
        liMobile.className = "cursor-pointer pl-3 hover:text-white";
        liMobile.onclick = () => {
          window.history.pushState({}, "", `/producto-categoria/${slug}/`);
          mostrarProductos(cat.trim().toUpperCase());
        };

        const liDesktop = document.createElement("li");
        liDesktop.textContent = cat;
        liDesktop.className = "cursor-pointer hover:text-red-500";
        liDesktop.onclick = () => {
          window.history.pushState({}, "", `/producto-categoria/${slug}/`);
          mostrarProductos(cat.trim().toUpperCase());
        };

        fragMobile.appendChild(liMobile);
        fragDesktop.appendChild(liDesktop);
      }
    }

    mobile.innerHTML = "";
    desktop.innerHTML = "";
    mobile.appendChild(fragMobile);
    desktop.appendChild(fragDesktop);
  }
  const cacheProductos = {};
  let productosActuales = [];

  // Detecta categoría desde la URL y carga los productos
  function detectarCategoriaDesdeURL() {
    const path = window.location.pathname;
    const partes = path.split("/").filter(Boolean); // elimina strings vacíos

    if (partes[0] === "producto-categoria" && partes[1]) {
      // Convierte slug a nombre de categoría
      const categoria = partes[1].replace(/-/g, " ").toUpperCase();
      mostrarProductos(categoria);
    }
  }

  // Maneja botones "Atrás/Adelante"
  window.addEventListener("popstate", () => {
    detectarCategoriaDesdeURL();
  });

  // Llama al cargar la página
  document.addEventListener("DOMContentLoaded", () => {
    detectarCategoriaDesdeURL();
  });

  async function mostrarProductos(categoria) {
    const home = document.getElementById("contenidoPrincipal");
    const vista = document.getElementById("vistaCategorias");
    const grid = document.getElementById("gridProductos");
    const titulo = document.getElementById("tituloCategoria");

    if (!home || !vista || !grid) return;

    home.style.display = "none";
    vista.style.display = "block";
    vista.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });

    titulo.textContent = categoria;
    document.title = categoria + " - Ultrallantas";

    const banner = document.getElementById("bannerLlantas");
    const hero = document.getElementById("heroBanner");
    const filtros = document.getElementById("filtrosLlantas");

    const cat = categoria.trim().toUpperCase();

    if (banner) {
      if (cat.includes("LLANTA")) {
        banner.style.display = "flex";

        if (hero) hero.style.display = "none"; // ocultar texto grande
        if (filtros) filtros.style.display = "block"; // mostrar filtros
      } else {
        banner.style.display = "none";
      }
    }

    // ⚡ Mostrar cache inmediato
    if (cacheProductos[cat]) {
      productosActuales = cacheProductos[cat];
      pintarProductos(productosActuales);
      return;
    }

    grid.innerHTML =
      "<p class='col-span-full text-center text-white py-10'>Cargando productos...</p>";

    try {
      const res = await fetch(
        `${API}/productos/categoria/${encodeURIComponent(cat)}`,
        {
          cache: "force-cache",
        },
      );

      const data = await res.json();
      const productos = data.productos || [];

      cacheProductos[cat] = productos;
      productosActuales = productos;

      if (cat.includes("LLANTA")) {
        cargarFiltrosLlantas(productos);
      }

      pintarProductos(productos);
    } catch (err) {
      grid.innerHTML =
        "<p class='col-span-full text-center text-white py-10'>Error cargando productos.</p>";
    }
  }

  window.addEventListener("load", () => {
    const btnCuenta = document.getElementById("btnCuenta");
    const modal = document.getElementById("modalLogin");
    const cerrar = document.querySelector(".cerrar-modal");

    if (!modal) return; // 🔒 evita errores

    // ABRIR
    if (btnCuenta) {
      btnCuenta.addEventListener("click", () => {
        modal.style.display = "flex";
      });
    }

    // CERRAR BOTÓN
    if (cerrar) {
      cerrar.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    // CERRAR AFUERA
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  window.addEventListener("load", () => {
    const btnIngresar = document.getElementById("btnIngresar");
    const inputCorreo = document.getElementById("correoAdmin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!btnIngresar) return;

    btnIngresar.addEventListener("click", async () => {
      const correo = inputCorreo.value.trim();

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!regex.test(correo)) {
        mensaje.textContent = "Ingresa un correo válido";
        mensaje.style.color = "red";
        return;
      }

      mensaje.textContent = "Enviando...";
      mensaje.style.color = "#999";

      try {
        const formData = new FormData();
        formData.append("correo", correo);

        const res = await fetch("/api/login.php", {
          method: "POST",
          body: formData,
        });

        const respuesta = await res.text();

        if (respuesta === "admin") {
          localStorage.setItem("admin", "true");
          window.location.href = "/pages/promociones/";
        } else {
          mensaje.textContent = "🔥 ¡Listo! Revisa tu correo";
          mensaje.style.color = "green";
          inputCorreo.value = "";
        }
      } catch (error) {
        mensaje.textContent = "Error de conexión";
        mensaje.style.color = "red";
      }
    });
  });

  function pintarProductos(productos) {
    const grid = document.getElementById("gridProductos");

    if (!productos.length) {
      grid.innerHTML =
        "<p class='col-span-full text-center text-white py-10'>No hay productos disponibles.</p>";
      return;
    }

    grid.innerHTML = "";

    productos.forEach((p) => {
      const slug = p.name
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const card = document.createElement("a");
      card.href = `https://ultrallantas.com/producto/${slug}/`;
      card.target = "_blank";

      card.className =
        "group relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 overflow-hidden";

      card.innerHTML = `
<div class="relative h-52 flex items-center justify-center bg-black/20">
<img src="assets/img/logo/logo.png"
class="h-40 object-contain transform group-hover:scale-110 group-hover:rotate-2 transition duration-500">
</div>

<div class="p-5 text-white">
<h3 class="font-semibold text-sm mb-2 line-clamp-2">
${p.name}
</h3>

<p class="text-red-400 font-bold text-lg">
$${p.price?.[0]?.price ?? "Consultar"}
</p>

<p class="text-xs opacity-70 mt-1">
Stock: ${p.inventory?.[0]?.inventory ?? 0}
</p>
</div>
`;

      grid.appendChild(card);
    });
  }

  function aplicarFiltros() {
    let lista = [...productosActuales];

    const ordenPrecio = document.getElementById("ordenPrecio")?.value;
    const ordenNombre = document.getElementById("ordenNombre")?.value;
    const stock = document.getElementById("filtroStock")?.value;

    if (stock === "con") {
      lista = lista.filter((p) => (p.inventory?.[0]?.inventory ?? 0) > 0);
    }

    if (stock === "sin") {
      lista = lista.filter((p) => (p.inventory?.[0]?.inventory ?? 0) === 0);
    }

    if (ordenPrecio === "asc") {
      lista.sort(
        (a, b) => (a.price?.[0]?.price ?? 0) - (b.price?.[0]?.price ?? 0),
      );
    }

    if (ordenPrecio === "desc") {
      lista.sort(
        (a, b) => (b.price?.[0]?.price ?? 0) - (a.price?.[0]?.price ?? 0),
      );
    }

    if (ordenNombre === "az") {
      lista.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (ordenNombre === "za") {
      lista.sort((a, b) => b.name.localeCompare(a.name));
    }

    pintarProductos(lista);
  }

  document.addEventListener("change", (e) => {
    if (
      e.target.id === "ordenPrecio" ||
      e.target.id === "ordenNombre" ||
      e.target.id === "filtroStock"
    ) {
      aplicarFiltros();
    }
    document.addEventListener("input", (e) => {
      if (e.target.id === "buscarNombre") {
        filtrarPorNombre(e.target.value);
      }
    });

    function filtrarPorNombre(texto) {
      let lista = [...productosActuales];

      const busqueda = texto.toLowerCase();

      lista = lista.filter((p) => p.name?.toLowerCase().includes(busqueda));

      pintarProductos(lista);
    }
  });

  /* =====================================================
       FILTRAR LLANTAS
===================================================== */

  document.addEventListener("click", async (e) => {
    if (e.target.id === "buscar") {
      await filtrarLlantas();
    }
  });

  async function filtrarLlantas() {
    const ancho = document.getElementById("ancho")?.value;
    const perfil = document.getElementById("perfil")?.value;
    const diametro = document.getElementById("diametro")?.value;

    const vista = document.getElementById("vistaCategorias");

    // Si estás en inicio, abrir categoría LLANTAS primero
    if (vista.classList.contains("hidden") || vista.style.display === "none") {
      await mostrarProductos("LLANTAS");
    }

    let lista = [...productosActuales];

    if (ancho) {
      lista = lista.filter((p) => p.heigh == ancho);
    }

    if (perfil) {
      lista = lista.filter((p) => p.width == perfil);
    }

    if (diametro) {
      lista = lista.filter((p) => p.depth == diametro);
    }

    pintarProductos(lista);

    // Scroll suave hacia los productos
    const grid = document.getElementById("gridProductos");
    if (grid) {
      setTimeout(() => {
        grid.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    }
  }
  /* =====================================================
       8. SUBMENÚ MÓVIL CATEGORÍAS
  ===================================================== */
  const btnMenu = document.getElementById("btnMenu");
  const menuMobile = document.getElementById("menuMobile");

  const btnCategoriasMobile = document.getElementById("btnCategoriasMobile");
  const submenuCategoriasMobile = document.getElementById(
    "submenuCategoriasMobile",
  );

  // Abrir menú móvil
  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      menuMobile.classList.toggle("hidden");
    });
  }

  // Abrir categorías
  if (btnCategoriasMobile) {
    btnCategoriasMobile.addEventListener("click", function () {
      submenuCategoriasMobile.classList.toggle("hidden");
    });
  }

  /* =====================================================
       9. DESKTOP DROPDOWN
  ===================================================== */
  const menuDesktop = document.getElementById("menuCategoriasDesktop");
  const submenuDesktop = document.getElementById("submenuCategoriasDesktop");

  if (menuDesktop && submenuDesktop) {
    let keepOpen = false;

    menuDesktop.addEventListener("mouseenter", () => {
      submenuDesktop.classList.remove("hidden");
    });

    submenuDesktop.addEventListener("mouseenter", () => {
      keepOpen = true;
      submenuDesktop.classList.remove("hidden");
    });

    submenuDesktop.addEventListener("mouseleave", () => {
      keepOpen = false;
      submenuDesktop.classList.add("hidden");
    });

    menuDesktop.addEventListener("mouseleave", () => {
      if (!keepOpen) submenuDesktop.classList.add("hidden");
    });

    menuDesktop.querySelector("span").addEventListener("click", (e) => {
      e.stopPropagation();
      submenuDesktop.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!menuDesktop.contains(e.target)) {
        submenuDesktop.classList.add("hidden");
      }
    });
  }

  cargarCategorias();

  // cargar filtros del buscador del inicio inmediatamente
  setTimeout(() => {
    precargarFiltrosLlantas();
  }, 300);

  setTimeout(() => {
    detectarCategoriaDesdeURL();
  }, 400);
});

function detectarCategoriaDesdeURL() {
  const path = window.location.pathname;

  if (!path.includes("producto-categoria")) return;

  const slug = path.split("producto-categoria/")[1]?.replace("/", "");
  if (!slug) return;

  const categoria = slug.replace(/-/g, " ").toUpperCase();

  mostrarProductos(categoria);
}

const botonesInicio = document.querySelectorAll(".btnInicio");
const logo = document.getElementById("logoInicio");

function irInicio() {
  const inicio = document.getElementById("contenidoPrincipal");
  const vistaCategorias = document.getElementById("vistaCategorias");
  const banner = document.getElementById("bannerLlantas");
  const hero = document.getElementById("heroBanner");
  const filtros = document.getElementById("filtrosLlantas");

  // Mostrar inicio
  if (inicio) inicio.style.display = "block";

  // Ocultar vista de categorías
  if (vistaCategorias) {
    vistaCategorias.style.display = "none";
    vistaCategorias.classList.add("hidden");
  }

  // Mostrar banner y hero
  if (banner) banner.style.display = "flex";
  if (hero) hero.style.display = "block";
  if (filtros) filtros.style.display = "block";

  // Cambiar la URL al inicio
  window.history.pushState({}, "", "/"); // Aquí actualizamos la URL a la raíz

  // Scroll arriba
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Botones INICIO
botonesInicio.forEach((btn) => {
  btn.addEventListener("click", irInicio);
});

// Logo
if (logo) {
  logo.addEventListener("click", irInicio);
}

// Detectar cambios del historial (Atrás/Adelante)
window.addEventListener("popstate", () => {
  if (window.location.pathname === "/") {
    irInicio();
  } else {
    // Aquí puedes llamar a tu función para mostrar la categoría según la URL
    detectarCategoriaDesdeURL();
  }
});

// continental

const track = document.getElementById("carouselTrack");

let position = 0;

function moverCarousel() {
  position += 0.5;

  track.style.transform = `translateX(-${position}px)`;

  if (position > track.scrollWidth - window.innerWidth) {
    position = 0;
  }

  requestAnimationFrame(moverCarousel);
}

moverCarousel();

function abrirCategoria(categoria) {
  const slug = categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  window.history.pushState({}, "", `/producto-categoria/${slug}/`);
  mostrarProductos(categoria.trim().toUpperCase());
}
