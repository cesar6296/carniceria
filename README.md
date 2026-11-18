# 🥩 Sistema de Gestión para Carnicería (MySQL + MongoDB)

> **Para ver la página web no abras este archivo.** Ejecuta `npm start` (o haz doble clic en `abrir-carniceria.command`) y abre [http://localhost:3000](http://localhost:3000). Este `.md` es solo documentación.

Sistema web integral full stack para carnicería con presencia multirregional, combinando **MySQL** (para catálogos estructurados y relacionales) y **MongoDB** (para ventas de alta concurrencia, lotes con rotación FIFO, mermas operativas e historial regional precalculado).

> La aplicación **no pide login**: al abrir la URL entra directo al dashboard. Todas las rutas de la API son de acceso abierto.

---

## Requisitos del Sistema

- **Node.js LTS** (v20 o superior) con **npm** (probado con Node v22.x).
- **MySQL Server 8** (local, XAMPP o Docker).
- **MongoDB** (MongoDB Atlas clúster gratuito M0 recomendado, o MongoDB Community local).

---

## Instalación y Puesta en Marcha

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

# Seguridad (opcional: la app abre sin login)
JWT_SECRET=una_clave_larga_y_aleatoria

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña
MYSQL_DATABASE=carniceria
MYSQL_SSL=false

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

## Despliegue en Vercel

El proyecto ya incluye `vercel.json`, la función serverless en `api/` y el adaptador `src/vercelHandler.js`. Vercel sirve `public/` como sitio estático desde su CDN y ejecuta Express en `/api/*`.

Cómo queda el enrutamiento (definido en `vercel.json`):
- `framework: null` desactiva la autodetección para que no choque con la configuración manual.
- `outputDirectory: public` publica `index.html`, `css/` y `js/`, sin exponer `src/`, `sql/` ni `.env`.
- `/api/*` se manda a la función `api/index.js` (Express completo).
- Cualquier otra ruta (`/dashboard`, `/inventario`, etc.) devuelve `index.html`, así que recargar la página en cualquier vista funciona.

### 1. Bases de datos remotas
Vercel no tiene acceso a `localhost`, así que necesitas:
- **MongoDB Atlas** (plan gratuito M0). En *Network Access* agrega `0.0.0.0/0`.
- **MySQL remoto**: Aiven, PlanetScale, Railway, Clever Cloud, etc. Ejecuta `sql/01_esquema.sql` y `sql/02_datos_base.sql` en ese servidor. Si la base ya existía, ejecuta también `sql/03_migracion_creado_en.sql`.

### 2. Variables de entorno en Vercel
En *Project Settings → Environment Variables* agrega:

| Variable | Ejemplo |
|---|---|
| `MONGODB_URI` | `mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/carniceria` |
| `MYSQL_HOST` | `tu-host.aivencloud.com` |
| `MYSQL_PORT` | `12345` |
| `MYSQL_USER` | `avnadmin` |
| `MYSQL_PASSWORD` | `tu_clave` |
| `MYSQL_DATABASE` | `carniceria` |
| `MYSQL_SSL` | `true` (según tu proveedor) |
| `JWT_SECRET` | opcional: la app ya no pide login |
| `NODE_ENV` | `production` |

### 3. Poblar MongoDB antes de desplegar
El seed **no** se ejecuta en Vercel. Córrelo desde tu computadora apuntando a Atlas:
```bash
MONGODB_URI="mongodb+srv://usuario:clave@cluster0.xxxxx.mongodb.net/carniceria" npm run seed
```

### 4. Desplegar
```bash
npx vercel
```
O conecta el repositorio desde el panel de Vercel. No hace falta comando de build.

### 5. Verificar
- `https://tu-proyecto.vercel.app/api/salud` debe responder `ok`.
- Si `mongodb` o `mysql` salen en error, revisa las variables de entorno y la lista de IP permitidas.
- Si ves `codigo: "MONGODB_NO_DISPONIBLE"`, la `MONGODB_URI` falta o Atlas bloquea la IP.

> **Importante:** en Vercel no se usa `mongodb-memory-server` (solo existe como dependencia de desarrollo). Sin `MONGODB_URI` válida la app responde 503 en las rutas privadas. Sin MySQL remoto la app entra en modo demostración con los catálogos en memoria y los cambios no se guardan entre peticiones.

---

## Reparto de Datos entre Bases de Datos

| Base de Datos | Entidades / Colecciones | Propósito |
|---|---|---|
| **MySQL** | `regiones`, `sucursales`, `clientes`, `proveedores`, `cortes` | Datos altamente estructurados, normalizados y con relaciones fijas. |
| **MongoDB** | `ventas`, `inventario_lotes`, `mermas`, `historial_regional`, `lecturas_refrigeracion` | Documentos flexibles, inventario FIFO dinámico, agregaciones analíticas de alto volumen. |

---

## Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|---|---|---|
| `ER_ACCESS_DENIED_ERROR` | Credenciales de MySQL incorrectas | Revisa `MYSQL_USER` y `MYSQL_PASSWORD` en `.env` |
| `ECONNREFUSED 127.0.0.1:3306` | Servicio de MySQL apagado | Inicia MySQL desde tus servicios del sistema o XAMPP |
| `MongoServerSelectionError` | MongoDB Atlas bloquea la IP | En Atlas ve a *Network Access* y agrega `0.0.0.0/0` |
| `codigo: "MONGODB_NO_DISPONIBLE"` en Vercel | Falta `MONGODB_URI`, quedó en `localhost` o Atlas bloquea la IP | Agrega `MONGODB_URI` en *Production*, **vuelve a desplegar** y abre `/api/salud` para ver el detalle exacto |
| Cambié variables y no surten efecto | Vercel no actualiza despliegues existentes | *Deployments* → menú `...` → **Redeploy** |
| `MongoServerError: bad auth` | Contraseña de Atlas incorrecta o con símbolos sin codificar | Recuerda que `@` = `%40`, `:` = `%3A`, `/` = `%2F`, `#` = `%23` |
| `No se pudo conectar a MongoDB` en Vercel | `MONGODB_URI` vacía o IP bloqueada | Configura Atlas y permite `0.0.0.0/0`; en Vercel no existe MongoDB en memoria |
| `Puerto 3000 en uso` | Conflicto de puertos | Cambia `PORT=3001` en `.env` |

