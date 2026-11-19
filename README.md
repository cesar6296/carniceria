# 🥩 Sistema de Gestión para Carnicería — MongoDB

Sistema web full stack para una carnicería multirregional. Toda la información operativa y de catálogo se guarda en MongoDB; no se necesita MySQL.

La aplicación incluye autenticación con cookie `HttpOnly`, ventas, inventario por lotes FIFO, mermas, consultas analíticas y una interfaz web para revisar los datos.

## Colecciones

Catálogos:

- `regiones`
- `sucursales`
- `clientes`
- `proveedores`
- `cortes`
- `usuarios`

Operación y análisis:

- `ventas`
- `inventario_lotes`
- `mermas`
- `historial_regional`
- `lecturas_refrigeracion`

Los modelos de Mongoose crean índices únicos para los IDs de catálogo y los índices de consulta para fechas, sucursal, región, tipo de carne y estatus.

## Instalación

Requisitos: Node.js 20 o superior y una instancia de MongoDB local o MongoDB Atlas.

```bash
npm install
cp .env.example .env
npm run admin:hash
```

Guarda el hash generado en `ADMIN_PASSWORD_HASH` y configura `MONGODB_URI` en `.env`. Al iniciar o hacer seed se crea el administrador inicial en `usuarios`.

## Cargar datos de demostración

Este comando crea los catálogos y regenera las colecciones operativas de MongoDB con datos ficticios:

```bash
npm run seed
```

Si la base ya tiene ventas o inventario y solo faltan los catálogos, usa este comando seguro:

```bash
MONGODB_URI="tu_uri_de_atlas" npm run seed:catalogos
```

Este comando no elimina datos operativos.

También se pueden generar ventas deterministas de 2026:

```bash
npm run seed:ventas-2026 -- --dry-run
npm run seed:ventas-2026
```

El `dry-run` solo muestra cuántos documentos se prepararían y no escribe en MongoDB.

## Ejecutar la aplicación

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000). La API de salud está en [http://localhost:3000/api/salud](http://localhost:3000/api/salud).

## Operaciones para la evaluación de MongoDB

El siguiente comando demuestra inserción, consultas, eliminación aleatoria e indexación:

```bash
npm run mongo:operaciones -- insertar
npm run mongo:operaciones -- consultar
npm run mongo:operaciones -- eliminar
npm run mongo:operaciones -- eliminar --coleccion=clientes
npm run mongo:operaciones -- indices
npm run mongo:operaciones -- demo
```

`demo` ejecuta las cuatro etapas en orden. Por defecto, la eliminación aleatoria usa `$sample` sobre `clientes`; puedes elegir otra colección con `--coleccion=ventas`, `--coleccion=mermas`, etc. La eliminación real usa `deleteOne()` y la indexación ejecuta `createIndexes()` en todas las colecciones del sistema.

También puedes hacer estas operaciones desde la página web, entrando al menú **Operaciones MongoDB**. La pantalla pide confirmación antes de eliminar y no permite borrar usuarios, regiones ni sucursales para evitar dejar inutilizable el sistema.

Para comprobar el flujo sin tocar datos:

```bash
npm run mongo:operaciones -- demo --dry-run
```

## Pruebas

```bash
npm test
```

Las pruebas levantan una base MongoDB temporal para comprobar login, protección de rutas y lectura de catálogos.

## Despliegue en Vercel

Configura en Vercel:

| Variable | Uso |
|---|---|
| `MONGODB_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | Secreto largo para las sesiones |
| `ADMIN_USERNAME` | Usuario administrador |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt de la contraseña |
| `NODE_ENV` | `production` |

El seed de ventas, lotes y mermas se ejecuta desde una computadora con acceso a Atlas; no se ejecuta automáticamente en Vercel. Los catálogos base se preparan automáticamente al recibir la primera petición de la función.

La carpeta `sql/` se conserva como material histórico de la versión anterior, pero la aplicación actual no importa MySQL ni ejecuta esos archivos.
