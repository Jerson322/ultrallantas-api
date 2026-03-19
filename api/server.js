import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const URL_LOGIN =
  "http://200.116.191.17/agilapi/api/agillogin/authenticate";
const URL_PRODUCTOS =
  "http://200.116.191.17/agilapi/api/customer/product";

// ==========================
// CACHE GLOBAL
// ==========================
let cacheProductos = null;
let cacheTiempoProductos = 0;
const CACHE_TIEMPO_PRODUCTOS = 1000 * 60 * 10; // 10 minutos

// ==========================
// LOGIN
// ==========================
async function obtenerToken() {
  const login = await fetch(URL_LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      Username: "Agil",
      Password: "AgilApi#2020*",
    }),
  });

  let token = await login.text();
  token = token.replace(/"/g, "").trim();
  return token;
}

// ==========================
// TRAER PRODUCTOS DEL ERP
// ==========================
async function traerProductosERP() {
  const token = await obtenerToken();

  const response = await fetch(URL_PRODUCTOS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      Empresa: "001",
      inicio: "0",
      Limite: "2000",
    }),
  });

  const rawData = await response.text();

  let data;
  try {
    data = JSON.parse(rawData);
  } catch {
    return [];
  }

  // Buscar el array real
  function encontrarArray(obj) {
    if (Array.isArray(obj)) return obj;

    for (const key in obj) {
      if (Array.isArray(obj[key])) return obj[key];
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const res = encontrarArray(obj[key]);
        if (res) return res;
      }
    }
    return [];
  }

  return encontrarArray(data);
}

// ==========================
// OBTENER PRODUCTOS (CACHE)
// ==========================
async function obtenerProductos() {
  if (
    cacheProductos &&
    Date.now() - cacheTiempoProductos < CACHE_TIEMPO_PRODUCTOS
  ) {
    console.log("⚡ Productos desde cache");
    return cacheProductos;
  }

  console.log("🔄 Consultando ERP...");
  const productos = await traerProductosERP();

  cacheProductos = productos;
  cacheTiempoProductos = Date.now();

  return productos;
}

// ==========================
// ENDPOINT PRODUCTOS
// ==========================
app.get("/productos", async (req, res) => {
  try {
    const productos = await obtenerProductos();

    res.json({
      total: productos.length,
      resultados: productos,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error productos");
  }
});

// ==========================
// PRODUCTOS POR CATEGORIA
// ==========================
app.get("/productos/categoria/:categoria", async (req, res) => {
  try {
    const categoria = req.params.categoria.toUpperCase();

    const productos = await obtenerProductos();

    const filtrados = productos.filter(
      (p) => p.grupo?.toUpperCase() === categoria,
    );

    res.json({
      total: filtrados.length,
      productos: filtrados,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error categoria");
  }
});

// ==========================
// CATEGORIAS
// ==========================
app.get("/categorias", async (req, res) => {
  try {
    const productos = await obtenerProductos();

    const excluir = [
      "Neumatico sellomatic",
      "Neumaticos",
      "Bandas",
      "Aceites",
      "Lubricantes",
      "Refrigerante",
      "LIQUIDO DE FRENOS",
      "BEBIDAS",
      "ACUTRAS",
      "SERVICIOS VARIOS",
      "RADIOS",
      "GRASA",
      "TACOS",
      "FLTROS DE ACEITE",
      "SELLOMATIC",
      "CABALLETES",
      "MANILARES",
      "RINES",
      "BOMBA DE ACEITE",
      "REPUESTOS",
      "CARPAS PARA MOTO",
      "FILTROS DE AIRE",
      "PARCHES",
    ];

    const categorias = [
      ...new Set(
        productos
          .map((p) => p.grupo)
          .filter(Boolean)
          .filter((cat) => !excluir.includes(cat)),
      ),
    ];

    res.json({
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error categorias");
  }
});

// ==========================
// SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});