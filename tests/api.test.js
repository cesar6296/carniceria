const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { conectarMongoDB, desconectarMongoDB } = require('../src/config/mongo');
const CatalogoRepository = require('../src/repositories/catalogoRepository');
const UsuarioRepository = require('../src/repositories/usuarioRepository');

describe('Pruebas de Integración - API Carnicería', () => {
  beforeAll(async () => {
    delete process.env.MONGODB_URI;
    process.env.NODE_ENV = 'test';
    await conectarMongoDB();
    await CatalogoRepository.sembrarCatalogos();
  });

  afterAll(async () => {
    await desconectarMongoDB();
  });

  it('GET /api/salud debe responder con estado del servidor', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBeDefined();
    expect(res.body).toHaveProperty('estado');
    expect(res.body).toHaveProperty('mongodb');
  });

  it('POST /api/auth/login valida el hash y emite una cookie HttpOnly', async () => {
    const hashAnterior = process.env.ADMIN_PASSWORD_HASH;
    const usuarioAnterior = process.env.ADMIN_USERNAME;
    process.env.ADMIN_USERNAME = 'uzielitoremix';
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('clave-prueba-segura', 4);
    await UsuarioRepository.asegurarAdministrador();

    try {
      const login = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'uzielitoremix', password: 'clave-prueba-segura' });

      expect(login.status).toBe(200);
      expect(login.body.datos).not.toHaveProperty('token');
      const cookie = login.headers['set-cookie'].find(value => value.startsWith('carniceria_session='));
      expect(cookie).toMatch(/HttpOnly/i);

      const datosPrivados = await request(app)
        .get('/api/cortes')
        .set('Cookie', cookie.split(';')[0]);
      expect(datosPrivados.status).toBe(200);
    } finally {
      if (hashAnterior === undefined) delete process.env.ADMIN_PASSWORD_HASH;
      else process.env.ADMIN_PASSWORD_HASH = hashAnterior;
      if (usuarioAnterior === undefined) delete process.env.ADMIN_USERNAME;
      else process.env.ADMIN_USERNAME = usuarioAnterior;
    }
  });

  it('GET /api/cortes debe exigir una sesión', async () => {
    const res = await request(app).get('/api/cortes');
    expect(res.status).toBe(401);
  });

  it('GET /api/sucursales debe exigir una sesión', async () => {
    const res = await request(app).get('/api/sucursales');
    expect(res.status).toBe(401);
  });

  it('POST /api/ventas debe exigir una sesión antes de validar datos', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .send({ cliente_id: 1, sucursal_id: 1, items: [] });
    expect(res.status).toBe(401);
  });

  it('POST /api/mermas debe exigir una sesión', async () => {
    const res = await request(app)
      .post('/api/mermas')
      .send({ lote_id: 'invalido', kg: -5, motivo: 'motivo_inexistente' });
    expect(res.status).toBe(401);
  });

  it('permite consultar colecciones, eliminar aleatoriamente e indexar con sesión', async () => {
    const hashAnterior = process.env.ADMIN_PASSWORD_HASH;
    const usuarioAnterior = process.env.ADMIN_USERNAME;
    process.env.ADMIN_USERNAME = 'uzielitoremix';
    process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash('clave-prueba-segura', 4);

    try {
      await UsuarioRepository.asegurarAdministrador();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ usuario: 'uzielitoremix', password: 'clave-prueba-segura' });
      const cookie = login.headers['set-cookie'].find(value => value.startsWith('carniceria_session='));

      const resumen = await request(app)
        .get('/api/mongo/resumen')
        .set('Cookie', cookie.split(';')[0]);
      expect(resumen.status).toBe(200);
      expect(resumen.body.datos).toHaveProperty('clientes');

      const eliminado = await request(app)
        .post('/api/mongo/eliminar-aleatorio')
        .set('Cookie', cookie.split(';')[0])
        .send({ coleccion: 'clientes' });
      expect(eliminado.status).toBe(200);
      expect(eliminado.body.datos.coleccion).toBe('clientes');

      const indices = await request(app)
        .post('/api/mongo/indices')
        .set('Cookie', cookie.split(';')[0])
        .send({});
      expect(indices.status).toBe(200);
      expect(indices.body.datos).toHaveProperty('ventas');
    } finally {
      if (hashAnterior === undefined) delete process.env.ADMIN_PASSWORD_HASH;
      else process.env.ADMIN_PASSWORD_HASH = hashAnterior;
      if (usuarioAnterior === undefined) delete process.env.ADMIN_USERNAME;
      else process.env.ADMIN_USERNAME = usuarioAnterior;
    }
  });
});
