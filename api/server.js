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

  if (cacheProductos && ahora - cacheTiempoProductos < CACHE_TIEMPO_PRODUCTOS) {
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
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "ultraca4_admin2",
  password: "NYK!NzlbUAzL",
  database: "ultraca4_usuarios",
  waitForConnections: true,
  connectionLimit: 10,
});

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

    res.json({ total: categorias.length, categorias });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send(error.message);
  }
});

// Nuevos endpoints Admin
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT correo, rol FROM USUARIOS ORDER BY fecha_registro DESC",
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/promociones", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM promociones WHERE activa = 1 AND (fecha_fin IS NULL OR fecha_fin > NOW()) ORDER BY fecha_inicio DESC",
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Table not found - run SQL" });
  }
});

app.post("/api/promociones", async (req, res) => {
  try {
    const { tipo, target, descuento } = req.body;
    const [result] = await pool.query(
      "INSERT INTO promociones (tipo, target, descuento) VALUES (?, ?, ?)",
      [tipo, JSON.stringify(target), descuento],
    );
    res.json({ success: true, id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/notificaciones", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notificaciones WHERE leida = 0 ORDER BY fecha DESC LIMIT 10",
    );
    res.json(rows);
  } catch (e) {
    res.json([]);
  }
});

// Promo aplicada en productos
app.get("/api/productos-con-promo", async (req, res) => {
  try {
    const productos = await obtenerProductos();
    const [promos] = await pool.query(
      "SELECT * FROM promociones WHERE activa = 1",
    );

    const productosConPromo = productos
      .map((p) => {
        let descuentoTotal = 0;
        promos.forEach((promo) => {
          if (promo.tipo === "global")
            descuentoTotal += parseFloat(promo.descuento);
          else if (promo.tipo === "categoria" && promo.target.includes(p.grupo))
            descuentoTotal += parseFloat(promo.descuento);
          // TODO: producto específico por ID
        });
        p.descuento_aplicado = descuentoTotal;
        p.precio_final = p.price?.[0]?.price * (1 - descuentoTotal / 100);
        return p;
      })
      .filter((p) => p.descuento_aplicado > 0);

    res.json({ resultados: productosConPromo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================
// SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
