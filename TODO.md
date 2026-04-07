# TODO: Admin Panel Enhancements - PROGRESS

## 1. [x] Backend APIs

- [x] mysql2 installed
- [x] server.js endpoints (usuarios/promos/notifs/productos-con-promo)
- [x] crear-usuario.php + listar-usuarios.php
- [x] promociones.php + notificaciones.php

## 2. [x] Admin Panel Users

- [x] HTML/JS/CSS for users tab (add/list)

## 3. [ ] DB Setup (REQUIRED)

```
CREATE TABLE IF NOT EXISTS promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(50),
  target JSON,
  descuento DECIMAL(5,2),
  fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TIMESTAMP NULL,
  activa TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mensaje TEXT,
  tipo VARCHAR(20),
  leida TINYINT(1) DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Run in phpMyAdmin on `ultraca4_usuarios`.

## 4. [ ] Admin Promos

- [ ] Enhanced form + save to DB

## 5. [ ] Frontend app.js promo apply

## 6. [ ] Test: Restart api/server.js (`node api/server.js`)
