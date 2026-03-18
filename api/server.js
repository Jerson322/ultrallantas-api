import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors()); // 🔥 IMPORTANTE
app.use(express.json());

const URL_LOGIN = "http://200.116.191.17/agilapi/api/agillogin/authenticate";
const URL_PRODUCTOS = "http://200.116.191.17/agilapi/api/customer/product";

app.get("/productos", async (req, res) => {
  try {
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

    const response = await fetch(URL_PRODUCTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Empresa: "001",
        inicio: "0",
        Limite: "500000", // puedes cambiar esto dinámico después
      }),
    });

    const rawData = await response.text();

    console.log("RESPUESTA ORIGINAL:", rawData);

    let data;

    // ==========================
    // INTENTAR PARSEAR A JSON
    // ==========================
    try {
      data = JSON.parse(rawData);
    } catch {
      // Si NO es JSON válido, lo devolvemos tal cual
      return res.send(rawData);
    }

    // ==========================
    // PARAMETROS
    // ==========================
    const { buscar = "", orden = "", tipo = "asc" } = req.query;

    // ==========================
    // FILTRAR
    // ==========================
    if (buscar) {
      data = data.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(buscar.toLowerCase()),
      );
    }

    // ==========================
    // ORDENAR
    // ==========================
    if (orden) {
      data.sort((a, b) => {
        const valA = a[orden] || "";
        const valB = b[orden] || "";

        if (tipo === "desc") return valA > valB ? -1 : 1;
        return valA > valB ? 1 : -1;
      });
    }

    // ==========================
    // RESPUESTA ORGANIZADA
    // ==========================
    res.json({
      total: data.length,
      resultados: data,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Error trayendo productos");
  }
});

app.get("/categorias", async (req, res) => {
  try {
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

    const response = await fetch(URL_PRODUCTOS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        Empresa: "001",
        inicio: "0",
        Limite: "500000",
      }),
    });

    const rawData = await response.text();

    let data;
    try {
      data = JSON.parse(rawData);
    } catch {
      return res.send(rawData);
    }

    // ==========================
    // 🔥 FUNCIÓN QUE ENCUENTRA EL ARRAY SOLO
    // ==========================
    function encontrarArray(obj) {
      if (Array.isArray(obj)) return obj;

      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          return obj[key];
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
          const res = encontrarArray(obj[key]);
          if (res) return res;
        }
      }
      return null;
    }

    const lista = encontrarArray(data);

    if (!Array.isArray(lista)) {
      console.log("DATA COMPLETA:", data);
      return res.send("No se pudo encontrar lista de productos");
    }

    console.log("PRIMER PRODUCTO:", lista[0]);

    // ==========================
    // SACAR CATEGORIAS
    // ==========================
    const categorias = [
      ...new Set(
        lista
          .map((p) => p.grupo) // 👈 ESTE YA ES CORRECTO SEGÚN TU DATA
          .filter(Boolean),
      ),
    ];

    res.json({
      total: categorias.length,
      categorias,
    });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).send("Error obteniendo categorias");
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
