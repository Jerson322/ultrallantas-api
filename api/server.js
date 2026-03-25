import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const URL_LOGIN = "http://200.116.191.17/agilapi/api/agillogin/authenticate";
const URL_PRODUCTOS = "http://200.116.191.17/agilapi/api/customer/product";

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
// ==========================
// TRAER TODOS LOS PRODUCTOS DEL ERP (PAGINADO)
// ==========================
async function traerProductosERP() {
  const token = await obtenerToken();

  let todosLosProductos = [];
  let inicio = 0;
  const limite = 2000;
  let continuar = true;

  while (continuar) {
    console.log("Consultando ERP desde:", inicio);

    const response = await fetch(URL_PRODUCTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Empresa: "001",
        inicio: inicio.toString(),
        Limite: limite.toString(),
      }),
    });

    const rawData = await response.text();

    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      console.log("Error parseando ERP");
      break;
    }

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

    const productos = encontrarArray(data);

    if (!productos.length) {
      continuar = false;
      break;
    }

    todosLosProductos = todosLosProductos.concat(productos);

    if (productos.length < limite) {
      continuar = false;
    } else {
      inicio += limite;
    }
  }

  console.log("TOTAL PRODUCTOS ERP:", todosLosProductos.length);

  return todosLosProductos;
}

// ==========================
// OBTENER PRODUCTOS (CACHE)
// ==========================
async function obtenerProductos() {
  const ahora = Date.now();

  if (
    cacheProductos &&
    ahora - cacheTiempoProductos < CACHE_TIEMPO_PRODUCTOS
  ) {
    console.log("⚡ Usando cache");
    return cacheProductos;
  }

  console.log("🔄 Actualizando productos ERP...");
  const productos = await traerProductosERP();

  cacheProductos = productos;
  cacheTiempoProductos = ahora;

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
    const categoria = req.params.categoria.toString().trim().toUpperCase();

    const productos = await obtenerProductos();

    const filtrados = productos.filter((p) => {
      const grupo = p.grupo?.toString().trim().toUpperCase();

      const stockTotal =
        p.inventory?.reduce((acc, i) => acc + (i.inventory || 0), 0) || 0;

      return grupo === categoria && stockTotal > 0;
    });

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
      "NEUMATICO-SELLOMATIC",
      "SELLOMATIC",
      "NEUMATICOS",
      "BANDAS",
      "ACEITE",
      "LUBRICANTES",
      "REFRIGERANTE",
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
    console.log("ERROR REAL:", error);
    res.status(500).send(error.message);
  }
});

// ==========================
// SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
