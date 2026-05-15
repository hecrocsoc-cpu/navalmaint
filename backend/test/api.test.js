const request = require('supertest')
const app = require('../src/index')

let tokenAdmin = ''

describe('NavalMaint API Tests', () => {

  // TEST 1
  test('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  // TEST 2
  test('POST /api/auth/register → 201 con usuario nuevo', async () => {
    const timestamp = Date.now()
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test_${timestamp}@navalmaint.com`,
        password: 'Test1234!',
        nombre: 'Test User'
      })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario).toBeDefined()
  })

  // TEST 3
  test('POST /api/auth/login → 200 con token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@navalmaint.com',
        password: 'Admin1234'
      })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.usuario).toBeDefined()
    tokenAdmin = res.body.token
  })

  // TEST 4
  test('POST /api/auth/login → 400 con credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@navalmaint.com',
        password: 'wrongpassword'
      })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  // TEST 5
  test('GET /api/tasks sin token → 401', async () => {
    const res = await request(app).get('/api/tasks')
    expect(res.status).toBe(401)
  })

  // TEST 6
  test('GET /api/tasks con token → 200', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
  })

  // TEST 7
  test('GET /api/stock con token → 200', async () => {
    const res = await request(app)
      .get('/api/stock')
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
  })

  // TEST 8
  test('GET /api/stock/alertas con token → 200', async () => {
    const res = await request(app)
      .get('/api/stock/alertas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
    expect(res.status).toBe(200)
  })

})