const Region = require('../models/Region');
const Sucursal = require('../models/Sucursal');
const Cliente = require('../models/Cliente');
const Proveedor = require('../models/Proveedor');
const Corte = require('../models/Corte');
const datosIniciales = require('../data/catalogosIniciales');

function numeroValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

async function siguienteId(Model) {
  const ultimo = await Model.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
  return (ultimo?.id || 0) + 1;
}

async function nombreDeRegion(regionId) {
  if (!regionId) return undefined;
  const region = await Region.findOne({ id: regionId }).select({ nombre: 1 }).lean();
  if (!region) {
    const error = new Error('La región especificada no existe');
    error.statusCode = 400;
    throw error;
  }
  return region.nombre;
}

function operacionesUpsert(Model, datos) {
  return datos.map((documento) => ({
    updateOne: {
      filter: { id: documento.id },
      update: { $setOnInsert: documento },
      upsert: true
    }
  }));
}

const CatalogoRepository = {
  async sembrarCatalogos() {
    await Region.bulkWrite(operacionesUpsert(Region, datosIniciales.regiones), { ordered: false });

    const regiones = await Region.find().select({ id: 1, nombre: 1 }).lean();
    const nombresRegion = new Map(regiones.map(region => [region.id, region.nombre]));

    const sucursales = datosIniciales.sucursales.map(sucursal => ({
      ...sucursal,
      region_nombre: nombresRegion.get(sucursal.region_id) || `Región ${sucursal.region_id}`
    }));
    const clientes = datosIniciales.clientes.map(cliente => ({
      ...cliente,
      region_nombre: nombresRegion.get(cliente.region_id),
      pais: cliente.pais || 'México'
    }));

    await Promise.all([
      Sucursal.bulkWrite(operacionesUpsert(Sucursal, sucursales), { ordered: false }),
      Cliente.bulkWrite(operacionesUpsert(Cliente, clientes), { ordered: false }),
      Proveedor.bulkWrite(operacionesUpsert(Proveedor, datosIniciales.proveedores), { ordered: false }),
      Corte.bulkWrite(operacionesUpsert(Corte, datosIniciales.cortes), { ordered: false })
    ]);

    return {
      regiones: datosIniciales.regiones.length,
      sucursales: datosIniciales.sucursales.length,
      clientes: datosIniciales.clientes.length,
      proveedores: datosIniciales.proveedores.length,
      cortes: datosIniciales.cortes.length
    };
  },

  async listarRegiones() {
    return Region.find().sort({ id: 1 }).lean();
  },

  async obtenerRegionPorId(id) {
    return Region.findOne({ id: numeroValido(id) }).lean();
  },

  async listarSucursales(filtros = {}) {
    const query = {};
    if (filtros.activa !== undefined) query.activa = filtros.activa === 'true' || filtros.activa === true;
    if (filtros.region_id) query.region_id = numeroValido(filtros.region_id);
    return Sucursal.find(query).sort({ id: 1 }).lean();
  },

  async obtenerSucursalPorId(id) {
    return Sucursal.findOne({ id: numeroValido(id) }).lean();
  },

  async crearSucursal(datos) {
    const regionId = numeroValido(datos.region_id);
    const regionNombre = await nombreDeRegion(regionId);
    const nueva = new Sucursal({
      id: await siguienteId(Sucursal),
      nombre: datos.nombre,
      ciudad: datos.ciudad,
      estado: datos.estado,
      region_id: regionId,
      region_nombre: regionNombre,
      activa: true
    });
    await nueva.save();
    return nueva.toObject();
  },

  async actualizarSucursal(id, datos) {
    const cambios = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.ciudad !== undefined ? { ciudad: datos.ciudad } : {}),
      ...(datos.estado !== undefined ? { estado: datos.estado } : {}),
      ...(datos.activa !== undefined ? { activa: Boolean(datos.activa) } : {})
    };
    if (datos.region_id !== undefined) {
      cambios.region_id = numeroValido(datos.region_id);
      cambios.region_nombre = await nombreDeRegion(cambios.region_id);
    }
    const actualizada = await Sucursal.findOneAndUpdate(
      { id: numeroValido(id) },
      { $set: cambios },
      { new: true, runValidators: true }
    ).lean();
    if (!actualizada) {
      const error = new Error('Sucursal no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return actualizada;
  },

  async eliminarSucursal(id) {
    const resultado = await Sucursal.updateOne({ id: numeroValido(id) }, { $set: { activa: false } });
    if (!resultado.matchedCount) {
      const error = new Error('Sucursal no encontrada');
      error.statusCode = 404;
      throw error;
    }
    return true;
  },

  async listarClientes(filtros = {}) {
    const query = {};
    if (filtros.tipo) query.tipo = filtros.tipo;
    if (filtros.region_id) query.region_id = numeroValido(filtros.region_id);
    return Cliente.find(query).sort({ id: -1 }).lean();
  },

  async obtenerClientePorId(id) {
    return Cliente.findOne({ id: numeroValido(id) }).lean();
  },

  async crearCliente(datos) {
    const regionId = datos.region_id ? numeroValido(datos.region_id) : undefined;
    const nuevo = new Cliente({
      id: await siguienteId(Cliente),
      nombre: datos.nombre,
      tipo: datos.tipo || 'mostrador',
      telefono: datos.telefono || undefined,
      correo: datos.correo || undefined,
      ciudad: datos.ciudad || undefined,
      pais: datos.pais || 'México',
      region_id: regionId,
      region_nombre: await nombreDeRegion(regionId)
    });
    await nuevo.save();
    return nuevo.toObject();
  },

  async actualizarCliente(id, datos) {
    const cambios = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.tipo !== undefined ? { tipo: datos.tipo } : {}),
      ...(datos.telefono !== undefined ? { telefono: datos.telefono } : {}),
      ...(datos.correo !== undefined ? { correo: datos.correo || undefined } : {}),
      ...(datos.ciudad !== undefined ? { ciudad: datos.ciudad } : {}),
      ...(datos.pais !== undefined ? { pais: datos.pais || 'México' } : {})
    };
    if (datos.region_id !== undefined) {
      cambios.region_id = datos.region_id ? numeroValido(datos.region_id) : undefined;
      cambios.region_nombre = await nombreDeRegion(cambios.region_id);
    }
    const actualizado = await Cliente.findOneAndUpdate(
      { id: numeroValido(id) },
      { $set: cambios },
      { new: true, runValidators: true }
    ).lean();
    if (!actualizado) {
      const error = new Error('Cliente no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return actualizado;
  },

  async listarProveedores(filtros = {}) {
    const query = {};
    if (filtros.activo !== undefined) query.activo = filtros.activo === 'true' || filtros.activo === true;
    return Proveedor.find(query).sort({ id: 1 }).lean();
  },

  async obtenerProveedorPorId(id) {
    return Proveedor.findOne({ id: numeroValido(id) }).lean();
  },

  async crearProveedor(datos) {
    const nuevo = new Proveedor({
      id: await siguienteId(Proveedor),
      nombre: datos.nombre,
      contacto: datos.contacto || undefined,
      telefono: datos.telefono || undefined,
      activo: true
    });
    await nuevo.save();
    return nuevo.toObject();
  },

  async actualizarProveedor(id, datos) {
    const cambios = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.contacto !== undefined ? { contacto: datos.contacto } : {}),
      ...(datos.telefono !== undefined ? { telefono: datos.telefono } : {}),
      ...(datos.activo !== undefined ? { activo: Boolean(datos.activo) } : {})
    };
    const actualizado = await Proveedor.findOneAndUpdate(
      { id: numeroValido(id) },
      { $set: cambios },
      { new: true, runValidators: true }
    ).lean();
    if (!actualizado) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return actualizado;
  },

  async eliminarProveedor(id) {
    const resultado = await Proveedor.updateOne({ id: numeroValido(id) }, { $set: { activo: false } });
    if (!resultado.matchedCount) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return true;
  },

  async listarCortes(filtros = {}) {
    const query = {};
    if (filtros.activo !== undefined) query.activo = filtros.activo === 'true' || filtros.activo === true;
    if (filtros.tipo_carne) query.tipo_carne = filtros.tipo_carne;
    return Corte.find(query).sort({ tipo_carne: 1, nombre: 1 }).lean();
  },

  async obtenerCortePorId(id) {
    return Corte.findOne({ id: numeroValido(id) }).lean();
  },

  async crearCorte(datos) {
    const nuevo = new Corte({
      id: await siguienteId(Corte),
      nombre: datos.nombre,
      tipo_carne: datos.tipo_carne,
      precio_kg: datos.precio_kg,
      activo: true
    });
    await nuevo.save();
    return nuevo.toObject();
  },

  async actualizarCorte(id, datos) {
    const cambios = {
      ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
      ...(datos.tipo_carne !== undefined ? { tipo_carne: datos.tipo_carne } : {}),
      ...(datos.precio_kg !== undefined ? { precio_kg: datos.precio_kg } : {}),
      ...(datos.activo !== undefined ? { activo: Boolean(datos.activo) } : {})
    };
    const actualizado = await Corte.findOneAndUpdate(
      { id: numeroValido(id) },
      { $set: cambios },
      { new: true, runValidators: true }
    ).lean();
    if (!actualizado) {
      const error = new Error('Corte no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return actualizado;
  },

  async eliminarCorte(id) {
    const resultado = await Corte.updateOne({ id: numeroValido(id) }, { $set: { activo: false } });
    if (!resultado.matchedCount) {
      const error = new Error('Corte no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return true;
  }
};

module.exports = CatalogoRepository;
