const request = require('supertest');
const app = require('../src/app');

describe('Pruebas de Integración - API Carnicería', () => {
  it('GET /api/salud debe responder con estado del servidor', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBeDefined();
    expect(res.body).toHaveProperty('estado');
    expect(res.body).toHaveProperty('mysql');
    expect(res.body).toHaveProperty('mongodb');
  });

  it('GET /api/cortes debe responder sin token (acceso abierto)', async () => {
    const res = await request(app).get('/api/cortes');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.datos)).toBe(true);
  });

  it('GET /api/sucursales debe responder sin token (acceso abierto)', async () => {
    const res = await request(app).get('/api/sucursales');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.datos)).toBe(true);
  });

  it('POST /api/ventas debe rechazar ventas sin items (Validación 400)', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .send({
        cliente_id: 1,
        sucursal_id: 1,
        items: []
      });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /api/mermas debe rechazar mermas con IDs inválidos o motivos incorrectos (400)', async () => {
    const res = await request(app)
      .post('/api/mermas')
      .send({
        lote_id: 'invalido',
        kg: -5,
        motivo: 'motivo_inexistente'
      });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
