const API = "https://ultrallantas-api.onrender.com";

let productos = [];
let categoriaSeleccionada = "";
let textoBusqueda = "";

// ==========================
// HELPERS
// ==========================
function $(id) {
  return document.getElementById(id);
}

// ==========================
// CAMBIO DE VISTA (NUEVO PRO)
// ==========================
function cambiarVista(vista) {
  document.querySelectorAll(".vista").forEach((v) => {
    v.classList.remove("activa");
    v.classList.add("hidden");
  });

  const el = $(vista);
  if (el) {
    el.classList.remove("hidden");
    el.classList.add("activa");
  }
}

const btnMenu = document.getElementById("btnMenuAdmin");
const sidebar = document.querySelector(".sidebar");

btnMenu.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// ==========================
// SKELETON
// ==========================
function mostrarSkeleton() {
  const grid = $("grid");

  if (!grid) return;

  grid.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const div = document.createElement("div");
    div.className = "card-producto-admin";
    div.style.height = "200px";
    div.style.background = "#1e293b";
    div.style.borderRadius = "10px";
    div.style.animation = "pulse 1s infinite";

    grid.appendChild(div);
  }
}

// ==========================
// CACHE
// ==========================
function guardarCache(data) {
  localStorage.setItem("productos_cache", JSON.stringify(data));
}

function obtenerCache() {
  try {
    return JSON.parse(localStorage.getItem("productos_cache")) || [];
  } catch {
    return [];
  }
}

// ==========================
// CARGAR PRODUCTOS
// ==========================
async function cargarProductos() {
  const cache = obtenerCache();

  if (cache.length) {
    productos = cache;
    llenarCategorias();
    aplicarFiltros();
    actualizarDashboard();
    generarActividad();
    generarAlertas();
    generarTopProductos();
  } else {
    mostrarSkeleton();
  }

  try {
    const res = await fetch(`${API}/productos`);
    const data = await res.json();

    let lista = data.resultados || [];

    lista = lista.filter((p) => {
      const stock =
        p.inventory?.reduce((a, i) => a + (i.inventory || 0), 0) || 0;
      return stock > 0;
    });

    if (JSON.stringify(lista) !== JSON.stringify(productos)) {
      productos = lista;

      guardarCache(productos);

      llenarCategorias();
      aplicarFiltros();
      actualizarDashboard();
      generarActividad();
      generarAlertas();
      generarTopProductos();
    }
  } catch (e) {
    console.warn("⚠ usando cache");
  }
}

// ==========================
// FILTROS
// ==========================
function aplicarFiltros() {
  let lista = [...productos];

  if (categoriaSeleccionada) {
    lista = lista.filter((p) => p.grupo === categoriaSeleccionada);
  }

  if (textoBusqueda) {
    lista = lista.filter((p) => p.name?.toLowerCase().includes(textoBusqueda));
  }

  pintarProductos(lista);
}

// ==========================
// PINTAR PRODUCTOS
// ==========================
function pintarProductos(lista) {
  const grid = $("grid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!lista.length) {
    grid.innerHTML = "<p>No hay productos</p>";
    return;
  }

  lista.forEach((p) => {
    const img = p.images?.[0]?.src || "/assets/img/logo/logo.png";
    const stock = p.inventory?.reduce((a, i) => a + (i.inventory || 0), 0) || 0;
    const precio = p.price?.[0]?.price ?? 0;

    const div = document.createElement("div");
    div.className = "card-producto-admin";

    div.innerHTML = `
      <img src="${img}" loading="lazy">
      <div class="card-info">
        <h3>${p.name || "Producto"}</h3>
        <div class="card-precio">$${precio}</div>
        <div class="card-stock ${stock < 5 ? "low" : ""}">
          Stock: ${stock}
        </div>
      </div>
    `;

    grid.appendChild(div);
  });
}

// ==========================
// DASHBOARD
// ==========================
function actualizarDashboard() {
  $("total") && ($("total").textContent = productos.length);

  $("sinImg") &&
    ($("sinImg").textContent = productos.filter(
      (p) => !p.images?.length,
    ).length);

  $("bajo") &&
    ($("bajo").textContent = productos.filter((p) => {
      const s = p.inventory?.reduce((a, i) => a + (i.inventory || 0), 0) || 0;
      return s > 0 && s < 5;
    }).length);

  $("nuevo") &&
    ($("nuevo").textContent = productos.filter((p) => {
      const f = new Date(p.createdAt || Date.now());
      return new Date() - f < 86400000;
    }).length);
}

function generarActividad() {
  const ul = $("actividad");
  if (!ul) return;

  ul.innerHTML = "";

  const recientes = [...productos]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (!recientes.length) {
    ul.innerHTML = "<li>No hay actividad reciente</li>";
    return;
  }

  recientes.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `🆕 ${p.name || "Producto"} agregado`;
    ul.appendChild(li);
  });
}

function generarAlertas() {
  const cont = $("alertas");
  if (!cont) return;

  cont.innerHTML = "";

  const sinImagen = productos.filter((p) => !p.images?.length).length;

  const bajoStock = productos.filter((p) => {
    const s = p.inventory?.reduce((a, i) => a + (i.inventory || 0), 0) || 0;
    return s > 0 && s < 5;
  }).length;

  if (!sinImagen && !bajoStock) {
    cont.innerHTML = "<p>✅ Todo está en orden</p>";
    return;
  }

  if (sinImagen) {
    cont.innerHTML += `<p>⚠ ${sinImagen} productos sin imagen</p>`;
  }

  if (bajoStock) {
    cont.innerHTML += `<p>🔥 ${bajoStock} productos con bajo stock</p>`;
  }
}

function generarTopProductos() {
  const cont = $("topProductos");
  if (!cont) return;

  cont.innerHTML = "";

  const top = [...productos]
    .sort((a, b) => (b.price?.[0]?.price ?? 0) - (a.price?.[0]?.price ?? 0))
    .slice(0, 6);

  top.forEach((p) => {
    const img = p.images?.[0]?.src || "/assets/img/logo/logo.png";
    const precio = p.price?.[0]?.price ?? 0;

    const div = document.createElement("div");
    div.className = "top-item";

    div.innerHTML = `
      <img src="${img}">
      <p>${p.name || "Producto"}</p>
      <span>$${precio}</span>
    `;

    cont.appendChild(div);
  });
}
// ==========================
// CATEGORÍAS
// ==========================
function llenarCategorias() {
  const select = $("categoria");
  if (!select) return;

  select.innerHTML = `<option value="">Todas</option>`;

  const categorias = [
    ...new Set(productos.map((p) => p.grupo).filter(Boolean)),
  ];

  categorias.sort();

  categorias.forEach((cat) => {
    const op = document.createElement("option");
    op.value = cat;
    op.textContent = cat;
    select.appendChild(op);
  });
}

// ==========================
// EVENTOS
// ==========================
$("buscar")?.addEventListener("input", (e) => {
  textoBusqueda = e.target.value.toLowerCase();
  aplicarFiltros();
});

$("categoria")?.addEventListener("change", (e) => {
  categoriaSeleccionada = e.target.value;
  aplicarFiltros();
});

$("orden")?.addEventListener("change", (e) => {
  let lista = [...productos];

  if (e.target.value === "asc") {
    lista.sort(
      (a, b) => (a.price?.[0]?.price ?? 0) - (b.price?.[0]?.price ?? 0),
    );
  }

  if (e.target.value === "desc") {
    lista.sort(
      (a, b) => (b.price?.[0]?.price ?? 0) - (a.price?.[0]?.price ?? 0),
    );
  }

  pintarProductos(lista);
});

// ==========================
// INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  $("fechaActual") &&
    ($("fechaActual").textContent = new Date().toLocaleDateString());

  cargarProductos();
});
