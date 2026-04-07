const URL_LOGIN = "http://200.116.191.17/agilapi/api/agillogin/authenticate";
const URL_PRODUCTOS = "http://200.116.191.17/agilapi/api/customer/product";

async function pruebaERP() {
  try {
    console.log("1️⃣ Probando conexión al ERP...");

    // LOGIN
    console.log("2️⃣ Intentando login...");
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

    console.log("Status login:", login.status);

    const rawToken = await login.text();
    console.log("Token crudo:", rawToken);

    const token = rawToken.replace(/"/g, "").trim();

    if (!token) {
      console.log("❌ No se obtuvo token");
      return;
    }

    console.log("✅ Token obtenido");

    // TRAER PRODUCTOS
    console.log("3️⃣ Consultando productos...");
    const productosRes = await fetch(URL_PRODUCTOS, {
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

    console.log("Status productos:", productosRes.status);

    const rawData = await productosRes.text();
    console.log("Respuesta cruda productos (primeros 500 chars):");
    console.log(rawData.slice(0, 500));

    let data;
    try {
      data = JSON.parse(rawData);
      console.log("✅ JSON parseado");
    } catch (e) {
      console.log("❌ Error parseando JSON");
      return;
    }

    // BUSCAR ARRAY
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

    console.log("📦 Productos encontrados:", productos.length);

    if (!productos.length) {
      console.log("⚠️ No se encontraron productos en la respuesta");
      return;
    }

    // SACAR CATEGORIAS
    const categorias = [
      ...new Set(productos.map((p) => p.grupo).filter(Boolean)),
    ];

    console.log("🏷️ Categorías encontradas:", categorias.length);
    console.log(categorias.slice(0, 20));

    console.log("🎉 Flujo completo funcionando");
  } catch (error) {
    console.log("❌ ERROR GENERAL:");
    console.log(error);
  }
}

pruebaERP();