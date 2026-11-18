const { pool } = require('../config/mysql');

// Datos locales de respaldo en memoria cuando MySQL local no tiene servicio levantado
const DATOS_FALLBACK = {
  regiones: [
    { id: 1, nombre: 'Noroeste' },
    { id: 2, nombre: 'Noreste' },
    { id: 3, nombre: 'Centro' },
    { id: 4, nombre: 'Occidente' },
    { id: 5, nombre: 'Sur' },
    { id: 6, nombre: 'Sureste' }
  ],
  sucursales: [
    { id: 1, nombre: 'Sucursal Culiacán Centro', ciudad: 'Culiacán', estado: 'Sinaloa', region_id: 1, region_nombre: 'Noroeste', activa: 1 },
    { id: 2, nombre: 'Sucursal Hermosillo Norte', ciudad: 'Hermosillo', estado: 'Sonora', region_id: 1, region_nombre: 'Noroeste', activa: 1 },
    { id: 3, nombre: 'Sucursal Monterrey San Pedro', ciudad: 'Monterrey', estado: 'Nuevo León', region_id: 2, region_nombre: 'Noreste', activa: 1 },
    { id: 4, nombre: 'Sucursal Saltillo Poniente', ciudad: 'Saltillo', estado: 'Coahuila', region_id: 2, region_nombre: 'Noreste', activa: 1 },
    { id: 5, nombre: 'Sucursal CDMX Del Valle', ciudad: 'Ciudad de México', estado: 'CDMX', region_id: 3, region_nombre: 'Centro', activa: 1 },
    { id: 6, nombre: 'Sucursal Guadalajara Providencia', ciudad: 'Guadalajara', estado: 'Jalisco', region_id: 4, region_nombre: 'Occidente', activa: 1 },
    { id: 7, nombre: 'Sucursal Oaxaca Reforma', ciudad: 'Oaxaca de Juárez', estado: 'Oaxaca', region_id: 5, region_nombre: 'Sur', activa: 1 },
    { id: 8, nombre: 'Sucursal Mérida Altabrisa', ciudad: 'Mérida', estado: 'Yucatán', region_id: 6, region_nombre: 'Sureste', activa: 1 }
  ],
  cortes: [
    { id: 1, nombre: 'Arrachera Marinada', tipo_carne: 'res', precio_kg: 245.00, creado_en: '2026-01-10T09:30:00Z', activo: 1 },
    { id: 2, nombre: 'Ribeye Prime', tipo_carne: 'res', precio_kg: 380.00, creado_en: '2026-01-12T10:15:00Z', activo: 1 },
    { id: 3, nombre: 'Tomahawk Steak', tipo_carne: 'res', precio_kg: 450.00, creado_en: '2026-01-15T11:00:00Z', activo: 1 },
    { id: 4, nombre: 'New York Strip', tipo_carne: 'res', precio_kg: 340.00, creado_en: '2026-01-18T14:20:00Z', activo: 1 },
    { id: 5, nombre: 'T-Bone', tipo_carne: 'res', precio_kg: 290.00, creado_en: '2026-01-20T08:45:00Z', activo: 1 },
    { id: 6, nombre: 'Costilla de Res Cargada', tipo_carne: 'res', precio_kg: 175.00, creado_en: '2026-01-22T13:10:00Z', activo: 1 },
    { id: 7, nombre: 'Carne Molida Especial 90/10', tipo_carne: 'res', precio_kg: 145.00, creado_en: '2026-01-25T16:00:00Z', activo: 1 },
    { id: 8, nombre: 'Diezmillo para Asar', tipo_carne: 'res', precio_kg: 195.00, creado_en: '2026-01-28T17:30:00Z', activo: 1 },
    { id: 9, nombre: 'Suadero de Res', tipo_carne: 'res', precio_kg: 155.00, creado_en: '2026-02-01T10:00:00Z', activo: 1 },
    { id: 10, nombre: 'Falda de Res para Deshebrar', tipo_carne: 'res', precio_kg: 165.00, creado_en: '2026-02-03T11:45:00Z', activo: 1 },
    { id: 11, nombre: 'Costilla de Cerdo BBQ', tipo_carne: 'cerdo', precio_kg: 135.00, creado_en: '2026-02-05T09:15:00Z', activo: 1 },
    { id: 12, nombre: 'Chuleta de Cerdo Ahumada', tipo_carne: 'cerdo', precio_kg: 120.00, creado_en: '2026-02-08T12:00:00Z', activo: 1 },
    { id: 13, nombre: 'Lomo de Cerdo', tipo_carne: 'cerdo', precio_kg: 130.00, creado_en: '2026-02-10T14:30:00Z', activo: 1 },
    { id: 14, nombre: 'Pierna de Cerdo con Hueso', tipo_carne: 'cerdo', precio_kg: 105.00, creado_en: '2026-02-12T15:00:00Z', activo: 1 },
    { id: 15, nombre: 'Panceta de Cerdo (Pork Belly)', tipo_carne: 'cerdo', precio_kg: 160.00, creado_en: '2026-02-15T16:20:00Z', activo: 1 },
    { id: 16, nombre: 'Espaldilla de Cerdo', tipo_carne: 'cerdo', precio_kg: 115.00, creado_en: '2026-02-18T10:10:00Z', activo: 1 },
    { id: 17, nombre: 'Pechuga de Pollo Entera', tipo_carne: 'pollo', precio_kg: 125.00, creado_en: '2026-02-20T08:30:00Z', activo: 1 },
    { id: 18, nombre: 'Milanesa de Pechuga de Pollo', tipo_carne: 'pollo', precio_kg: 145.00, creado_en: '2026-02-22T09:00:00Z', activo: 1 },
    { id: 19, nombre: 'Muslo y Pierna de Pollo', tipo_carne: 'pollo', precio_kg: 75.00, creado_en: '2026-02-25T11:25:00Z', activo: 1 },
    { id: 20, nombre: 'Alitas de Pollo Naturales', tipo_carne: 'pollo', precio_kg: 95.00, creado_en: '2026-02-27T13:40:00Z', activo: 1 },
    { id: 21, nombre: 'Costillar de Cordero Francés', tipo_carne: 'cordero', precio_kg: 420.00, creado_en: '2026-03-01T15:15:00Z', activo: 1 },
    { id: 22, nombre: 'Pierna de Cordero Deshuesada', tipo_carne: 'cordero', precio_kg: 310.00, creado_en: '2026-03-03T16:00:00Z', activo: 1 },
    { id: 23, nombre: 'Chorizo Artesanal Español', tipo_carne: 'embutido', precio_kg: 150.00, creado_en: '2026-03-05T10:00:00Z', activo: 1 },
    { id: 24, nombre: 'Longaniza Casera de Toluca', tipo_carne: 'embutido', precio_kg: 130.00, creado_en: '2026-03-08T11:30:00Z', activo: 1 },
    { id: 25, nombre: 'Chistorra Navarra Especial', tipo_carne: 'embutido', precio_kg: 185.00, creado_en: '2026-03-10T12:00:00Z', activo: 1 }
  ],
  clientes: [
    { id: 1, nombre: 'Carlos Eduardo Rivera', tipo: 'mostrador', telefono: '667-111-2233', correo: 'carlos.rivera@gmail.com', ciudad: 'Culiacán', region_id: 1, region_nombre: 'Noroeste', creado_en: '2026-01-05T08:15:00Z' },
    { id: 2, nombre: 'María Teresa López', tipo: 'mostrador', telefono: '662-222-3344', correo: 'teresa.lopez@hotmail.com', ciudad: 'Hermosillo', region_id: 1, region_nombre: 'Noroeste', creado_en: '2026-01-08T11:20:00Z' },
    { id: 3, nombre: 'José Luis Morales', tipo: 'mostrador', telefono: '811-333-4455', correo: 'jluis.morales@yahoo.com', ciudad: 'Monterrey', region_id: 2, region_nombre: 'Noreste', creado_en: '2026-01-12T14:40:00Z' },
    { id: 16, nombre: 'Restaurante Sonora Grill Culiacán', tipo: 'restaurante', telefono: '667-717-7788', correo: 'compras@sonoragrillcul.mx', ciudad: 'Culiacán', region_id: 1, region_nombre: 'Noroeste', creado_en: '2026-01-15T09:00:00Z' },
    { id: 18, nombre: 'El Gran Pastor Monterrey', tipo: 'restaurante', telefono: '811-919-9900', correo: 'abastecimiento@granpastor.com', ciudad: 'Monterrey', region_id: 2, region_nombre: 'Noreste', creado_en: '2026-01-18T10:30:00Z' },
    { id: 26, nombre: 'Distribuidora de Alimentos del Pacífico', tipo: 'mayorista', telefono: '667-898-9090', correo: 'pedidos@distribuidorapacifico.com', ciudad: 'Culiacán', region_id: 1, region_nombre: 'Noroeste', creado_en: '2026-01-20T16:00:00Z' }
  ],
  proveedores: [
    { id: 1, nombre: 'Ganadería del Norte S.A. de C.V.', contacto: 'Ing. Roberto Garza', telefono: '667-123-4567', creado_en: '2026-01-03T10:00:00Z', activo: 1 },
    { id: 2, nombre: 'Carnes Selectas de Sonora', contacto: 'Lic. Alejandro Elías', telefono: '662-987-6543', creado_en: '2026-01-04T12:00:00Z', activo: 1 },
    { id: 3, nombre: 'Porcícola del Bajío', contacto: 'Carlos Mendoza', telefono: '477-555-1212', creado_en: '2026-01-05T15:00:00Z', activo: 1 }
  ],
  usuarios: [
    {
      id: 1,
      nombre: 'Uzielito Remix',
      usuario: 'uzielitoremix',
      password_hash: '$2b$10$HWIPODptIhzghEC1xI9szOAZ0FD/DRCWDuVDJTmmAs2loIwADxPmm',
      rol: 'admin',
      activo: 1
    }
  ]
};

const CatalogoRepository = {
  async buscarUsuario(usuario) {
    try {
      const [filas] = await pool.query('SELECT * FROM usuarios WHERE usuario = ? AND activo = TRUE', [usuario]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.usuarios.find(u => u.usuario === usuario && u.activo) || null;
    }
  },
  // Regiones
  async listarRegiones() {
    try {
      const [filas] = await pool.query('SELECT * FROM regiones ORDER BY id ASC');
      return filas;
    } catch (e) {
      return DATOS_FALLBACK.regiones;
    }
  },

  async obtenerRegionPorId(id) {
    try {
      const [filas] = await pool.query('SELECT * FROM regiones WHERE id = ?', [id]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.regiones.find(r => r.id === Number(id)) || null;
    }
  },

  // Sucursales
  async listarSucursales(filtros = {}) {
    try {
      let sql = 'SELECT s.*, r.nombre AS region_nombre FROM sucursales s JOIN regiones r ON s.region_id = r.id WHERE 1=1';
      const params = [];
      if (filtros.activa !== undefined) {
        sql += ' AND s.activa = ?';
        params.push(filtros.activa === 'true' || filtros.activa === true ? 1 : 0);
      }
      if (filtros.region_id) {
        sql += ' AND s.region_id = ?';
        params.push(filtros.region_id);
      }
      sql += ' ORDER BY s.id ASC';
      const [filas] = await pool.query(sql, params);
      return filas;
    } catch (e) {
      return DATOS_FALLBACK.sucursales;
    }
  },

  async obtenerSucursalPorId(id) {
    try {
      const [filas] = await pool.query('SELECT s.*, r.nombre AS region_nombre FROM sucursales s JOIN regiones r ON s.region_id = r.id WHERE s.id = ?', [id]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.sucursales.find(s => s.id === Number(id)) || null;
    }
  },

  async crearSucursal(datos) {
    try {
      const { nombre, ciudad, estado, region_id } = datos;
      const [resultado] = await pool.query(
        'INSERT INTO sucursales (nombre, ciudad, estado, region_id) VALUES (?, ?, ?, ?)',
        [nombre, ciudad, estado, region_id]
      );
      return { id: resultado.insertId, ...datos, activa: 1 };
    } catch (e) {
      const nueva = { id: DATOS_FALLBACK.sucursales.length + 1, ...datos, activa: 1, region_nombre: 'Región' };
      DATOS_FALLBACK.sucursales.push(nueva);
      return nueva;
    }
  },

  async actualizarSucursal(id, datos) {
    try {
      const { nombre, ciudad, estado, region_id, activa } = datos;
      await pool.query(
        'UPDATE sucursales SET nombre = ?, ciudad = ?, estado = ?, region_id = ?, activa = ? WHERE id = ?',
        [nombre, ciudad, estado, region_id, activa !== undefined ? activa : 1, id]
      );
      return this.obtenerSucursalPorId(id);
    } catch (e) {
      return { id: Number(id), ...datos };
    }
  },

  async eliminarSucursal(id) {
    try {
      await pool.query('UPDATE sucursales SET activa = FALSE WHERE id = ?', [id]);
    } catch (e) {
      const s = DATOS_FALLBACK.sucursales.find(item => item.id === Number(id));
      if (s) s.activa = 0;
    }
    return true;
  },

  // Clientes
  async listarClientes(filtros = {}) {
    try {
      let sql = 'SELECT c.*, r.nombre AS region_nombre FROM clientes c LEFT JOIN regiones r ON c.region_id = r.id WHERE 1=1';
      const params = [];
      if (filtros.tipo) {
        sql += ' AND c.tipo = ?';
        params.push(filtros.tipo);
      }
      sql += ' ORDER BY c.id DESC';
      const [filas] = await pool.query(sql, params);
      return filas;
    } catch (e) {
      return DATOS_FALLBACK.clientes;
    }
  },

  async obtenerClientePorId(id) {
    try {
      const [filas] = await pool.query('SELECT c.*, r.nombre AS region_nombre FROM clientes c LEFT JOIN regiones r ON c.region_id = r.id WHERE c.id = ?', [id]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.clientes.find(c => c.id === Number(id)) || null;
    }
  },

  async crearCliente(datos) {
    const fechaActual = new Date().toISOString();
    try {
      const { nombre, tipo, telefono, correo, ciudad, region_id } = datos;
      const [resultado] = await pool.query(
        'INSERT INTO clientes (nombre, tipo, telefono, correo, ciudad, region_id) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, tipo || 'mostrador', telefono || null, correo || null, ciudad || null, region_id || null]
      );
      return this.obtenerClientePorId(resultado.insertId);
    } catch (e) {
      const nuevo = { id: DATOS_FALLBACK.clientes.length + 1, ...datos, creado_en: fechaActual, region_nombre: 'Centro' };
      DATOS_FALLBACK.clientes.push(nuevo);
      return nuevo;
    }
  },

  async actualizarCliente(id, datos) {
    try {
      const { nombre, tipo, telefono, correo, ciudad, region_id } = datos;
      await pool.query(
        'UPDATE clientes SET nombre = ?, tipo = ?, telefono = ?, correo = ?, ciudad = ?, region_id = ? WHERE id = ?',
        [nombre, tipo, telefono, correo, ciudad, region_id, id]
      );
      return this.obtenerClientePorId(id);
    } catch (e) {
      return { id: Number(id), ...datos };
    }
  },

  // Proveedores
  async listarProveedores(filtros = {}) {
    try {
      const [filas] = await pool.query('SELECT * FROM proveedores WHERE 1=1 ORDER BY id ASC');
      return filas;
    } catch (e) {
      return DATOS_FALLBACK.proveedores;
    }
  },

  async obtenerProveedorPorId(id) {
    try {
      const [filas] = await pool.query('SELECT * FROM proveedores WHERE id = ?', [id]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.proveedores.find(p => p.id === Number(id)) || null;
    }
  },

  async crearProveedor(datos) {
    try {
      const { nombre, contacto, telefono } = datos;
      const [resultado] = await pool.query(
        'INSERT INTO proveedores (nombre, contacto, telefono) VALUES (?, ?, ?)',
        [nombre, contacto || null, telefono || null]
      );
      return { id: resultado.insertId, ...datos, activo: 1 };
    } catch (e) {
      const nuevo = { id: DATOS_FALLBACK.proveedores.length + 1, ...datos, activo: 1 };
      DATOS_FALLBACK.proveedores.push(nuevo);
      return nuevo;
    }
  },

  async actualizarProveedor(id, datos) {
    try {
      const { nombre, contacto, telefono, activo } = datos;
      await pool.query(
        'UPDATE proveedores SET nombre = ?, contacto = ?, telefono = ?, activo = ? WHERE id = ?',
        [nombre, contacto, telefono, activo !== undefined ? activo : 1, id]
      );
      return this.obtenerProveedorPorId(id);
    } catch (e) {
      return { id: Number(id), ...datos };
    }
  },

  async eliminarProveedor(id) {
    try {
      await pool.query('UPDATE proveedores SET activo = FALSE WHERE id = ?', [id]);
    } catch (e) {
      const p = DATOS_FALLBACK.proveedores.find(item => item.id === Number(id));
      if (p) p.activo = 0;
    }
    return true;
  },

  // Cortes
  async listarCortes(filtros = {}) {
    try {
      let sql = 'SELECT * FROM cortes WHERE 1=1';
      const params = [];
      if (filtros.activo !== undefined) {
        sql += ' AND activo = ?';
        params.push(filtros.activo === 'true' || filtros.activo === true ? 1 : 0);
      }
      sql += ' ORDER BY tipo_carne ASC, nombre ASC';
      const [filas] = await pool.query(sql, params);
      return filas;
    } catch (e) {
      return DATOS_FALLBACK.cortes;
    }
  },

  async obtenerCortePorId(id) {
    try {
      const [filas] = await pool.query('SELECT * FROM cortes WHERE id = ?', [id]);
      return filas[0] || null;
    } catch (e) {
      return DATOS_FALLBACK.cortes.find(c => c.id === Number(id)) || null;
    }
  },

  async crearCorte(datos) {
    const fechaActual = new Date().toISOString();
    try {
      const { nombre, tipo_carne, precio_kg } = datos;
      const [resultado] = await pool.query(
        'INSERT INTO cortes (nombre, tipo_carne, precio_kg) VALUES (?, ?, ?)',
        [nombre, tipo_carne, precio_kg]
      );
      return { id: resultado.insertId, ...datos, creado_en: fechaActual, activo: 1 };
    } catch (e) {
      const nuevo = { id: DATOS_FALLBACK.cortes.length + 1, ...datos, creado_en: fechaActual, activo: 1 };
      DATOS_FALLBACK.cortes.push(nuevo);
      return nuevo;
    }
  },

  async actualizarCorte(id, datos) {
    try {
      const { nombre, tipo_carne, precio_kg, activo } = datos;
      await pool.query(
        'UPDATE cortes SET nombre = ?, tipo_carne = ?, precio_kg = ?, activo = ? WHERE id = ?',
        [nombre, tipo_carne, precio_kg, activo !== undefined ? activo : 1, id]
      );
      return this.obtenerCortePorId(id);
    } catch (e) {
      return { id: Number(id), ...datos };
    }
  },

  async eliminarCorte(id) {
    try {
      await pool.query('UPDATE cortes SET activo = FALSE WHERE id = ?', [id]);
    } catch (e) {
      const c = DATOS_FALLBACK.cortes.find(item => item.id === Number(id));
      if (c) c.activo = 0;
    }
    return true;
  }
};

module.exports = CatalogoRepository;
