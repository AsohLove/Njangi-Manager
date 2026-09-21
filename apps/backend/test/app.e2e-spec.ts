import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register - should register a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        full_name: 'Test User',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body.email).toContain('@example.com');
  });

  it('POST /api/auth/register - should reject duplicate email', async () => {
    const email = `duplicate-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        full_name: 'First User',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        full_name: 'Second User',
      })
      .expect(409);
  });

  it('POST /api/auth/login - should login and set session cookie', async () => {
    const email = `login-${Date.now()}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Login User',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    // expect(response.body).toHaveProperty('id');
    // expect(response.body.email).toBe(email);

    const cookies = response.headers['set-cookie'];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie: string) => cookie.startsWith('session_id=')),
    ).toBe(true);
  });

  it('POST /api/auth/logout - should clear the session', async () => {
    const email = `logout-${Date.now()}@example.com`;
    const password = 'Password123!';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Logout User',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie: string) => cookie.startsWith('session_id=')),
    ).toBe(true);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .expect(204);

    expect(logoutResponse.body).toEqual({});
  });

  it('POST /api/auth/login - should reject incorrect password', async () => {
    const email = `wrong-password-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Password123!',
        full_name: 'Wrong Password User',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('POST /api/auth/login - should reject unknown email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: `does-not-exist-${Date.now()}@example.com`,
        password: 'Password123!',
      })
      .expect(401);
  });

  it('GET /api/groups - should reject unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/api/groups').expect(401);
  });
});
