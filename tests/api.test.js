const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { JWT_SECRET } = require('../src/config/jwt');

const tokenPrueba = jwt.sign(
  { id: 1, nombre: 'Usuario de Prueba', usuario: 'prueba', rol: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const autorizado = (peticion) => peticion.set('Authorization', `Bearer ${tokenPrueba}`);

describe('Pruebas de Integración - API Carnicería', () => {
  it('GET /api/salud debe responder con estado del servidor', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBeDefined();
    expect(res.body).toHaveProperty('estado');
    expect(res.body).toHaveProperty('mysql');
    expect(res.body).toHaveProperty('mongodb');
  });

  it('GET /api/cortes debe rechazar peticiones sin token (401)', async () => {
    const res = await request(app).get('/api/cortes');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  it('GET /api/cortes debe devolver un arreglo con token válido', async () => {
    const res = await autorizado(request(app).get('/api/cortes'));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.datos)).toBe(true);
  });

  it('POST /api/ventas debe rechazar ventas sin items (Validación 400)', async () => {
    const res = await autorizado(
      request(app)
        .post('/api/ventas')
        .send({
          cliente_id: 1,
          sucursal_id: 1,
          items: []
        })
    );
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /api/mermas debe rechazar mermas con IDs inválidos o motivos incorrectos (400)', async () => {
    const res = await autorizado(
      request(app)
        .post('/api/mermas')
        .send({
          lote_id: 'invalido',
          kg: -5,
          motivo: 'motivo_inexistente'
        })
    );
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
