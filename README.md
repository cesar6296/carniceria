# 🥩 Sistema de Gestión para Carnicería (MySQL + MongoDB)

> **Para ver la página web no abras este archivo.** Ejecuta `npm start` (o haz doble clic en `abrir-carniceria.command`) y abre [http://localhost:3000](http://localhost:3000). Este `.md` es solo documentación.

Sistema web integral full stack para carnicería con presencia multirregional, combinando **MySQL** (para catálogos estructurados y relacionales) y **MongoDB** (para ventas de alta concurrencia, lotes con rotación FIFO, mermas operativas e historial regional precalculado).

---

## 📋 Requisitos del Sistema

- **Node.js LTS** (v18 o superior) con **npm** (probado con Node v22.x).
- **MySQL Server 8** (local, XAMPP o Docker).
- **MongoDB** (MongoDB Atlas clúster gratuito M0 recomendado, o MongoDB Community local).

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar e Instalar Dependencias
```bash
# Dentro de la carpeta del proyecto:
npm install
```

### 2. Configurar Variables de Entorno (`.env`)
Copia el archivo de ejemplo y ajusta tus credenciales:
```bash
# Mac / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Contenido del archivo `.env`:
```env
# Servidor
PORT=3000
NODE_ENV=development

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña
MYSQL_DATABASE=carniceria

# MongoDB (Ejemplo MongoDB Atlas)
MONGODB_URI=mongodb+srv://USUARIO:CONTRASEÑA@cluster0.xxxxx.mongodb.net/carniceria
USAR_TRANSACCIONES=false
```

### 3. Crear Esquema y Datos Base en MySQL
Ejecuta los scripts en orden:
```bash
mysql -u root -p < sql/01_esquema.sql
mysql -u root -p carniceria < sql/02_datos_base.sql
```
*(También puedes abrir ambos archivos `.sql` y ejecutarlos directamente en MySQL Workbench o DBeaver).*

### 4. Poblar MongoDB con el Historial y Lotes (Seed)
El script de seed es idempotente, carga más de 1,600 ventas históricas, lotes, mermas e historial regional:
```bash
npm run seed
```

### 5. Iniciar la Aplicación
```bash
# Modo desarrollo con recarga automática:
npm run dev

# Modo producción:
npm start
```

Abrir en el navegador:
- **Panel Web:** [http://localhost:3000](http://localhost:3000)
- **Verificación de Salud:** [http://localhost:3000/api/salud](http://localhost:3000/api/salud)

### 6. Ejecutar Pruebas
```bash
npm test
```

---

## Reparto de Datos entre Bases de Datos

| Base de Datos | Entidades / Colecciones | Propósito |
|---|---|---|
| **MySQL** | `regiones`, `sucursales`, `clientes`, `proveedores`, `cortes` | Datos altamente estructurados, normalizados y con relaciones fijas. |
| **MongoDB** | `ventas`, `inventario_lotes`, `mermas`, `historial_regional`, `lecturas_refrigeracion` | Documentos flexibles, inventario FIFO dinámico, agregaciones analíticas de alto volumen. |

---

## 🔍 Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|---|---|---|
| `ER_ACCESS_DENIED_ERROR` | Credenciales de MySQL incorrectas | Revisa `MYSQL_USER` y `MYSQL_PASSWORD` en `.env` |
| `ECONNREFUSED 127.0.0.1:3306` | Servicio de MySQL apagado | Inicia MySQL desde tus servicios del sistema o XAMPP |
| `MongoServerSelectionError` | MongoDB Atlas bloquea la IP | En Atlas ve a *Network Access* y agrega `0.0.0.0/0` |
| `Puerto 3000 en uso` | Conflicto de puertos | Cambia `PORT=3001` en `.env` |

