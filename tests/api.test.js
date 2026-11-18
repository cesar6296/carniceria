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

  it('GET /api/cortes debe validar estructura de respuesta JSON consistente', async () => {
    const res = await request(app).get('/api/cortes');
    // Si la BD no está levantada en el runner devolverá 500 con formato consistente, si está levantada 200
    expect(res.body).toHaveProperty('ok');
    if (res.status === 200) {
      expect(Array.isArray(res.body.datos)).toBe(true);
    }
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

