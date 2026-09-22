import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import cookieParser from 'cookie-parser';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
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

  it('GET /api/groups/:id - should return 404 when another user requests the group', async () => {
    const timestamp = Date.now();

    const userAEmail = `owner-a-${timestamp}@example.com`;
    const userBEmail = `owner-b-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register User A
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: userAEmail,
        password,
        full_name: 'Owner A',
      })
      .expect(201);

    // Login User A
    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userAEmail,
        password,
      })
      .expect(200);

    const cookiesA = loginA.headers['set-cookie'];

    // User A creates a group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookiesA)
      .send({
        name: 'User A Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'fixed',
      })
      .expect(201);

    const groupId = groupResponse.body.id;

    // Register User B
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: userBEmail,
        password,
        full_name: 'Owner B',
      })
      .expect(201);

    // Login User B
    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: userBEmail,
        password,
      })
      .expect(200);

    const cookiesB = loginB.headers['set-cookie'];

    // User B tries to access User A's group
    await request(app.getHttpServer())
      .get(`/api/groups/${groupId}`)
      .set('Cookie', cookiesB)
      .expect(404);
  });

  it('POST /api/rounds/:id/payments - should reject duplicate payment', async () => {
    const timestamp = Date.now();
    const email = `payment-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register user
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Payment Tester',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    // Create group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookies)
      .send({
        name: 'Payment Test Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'fixed',
      })
      .expect(201);

    const groupId = groupResponse.body.id;

    // Create member
    const memberResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/members`)
      .set('Cookie', cookies)
      .send({
        full_name: 'Payment Member',
      })
      .expect(201);

    const memberId = memberResponse.body.id;

    // Create position
    const positionResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/positions`)
      .set('Cookie', cookies)
      .send({
        member_id: memberId,
      })
      .expect(201);

    const positionId = positionResponse.body.id;

    // Set the fixed position order
    await request(app.getHttpServer())
      .put(`/api/groups/${groupId}/positions/order`)
      .set('Cookie', cookies)
      .send({
        position_ids: [positionId],
      })
      .expect(204);

    // Start cycle
    const cycleResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/cycles`)
      .set('Cookie', cookies)
      .expect(201);

    const cycleId = cycleResponse.body.id;

    // Open round
    const roundResponse = await request(app.getHttpServer())
      .post(`/api/cycles/${cycleId}/rounds`)
      .set('Cookie', cookies)
      .send({
        method: 'auto',
      })
      .expect(201);

    const roundId = roundResponse.body.id;

    // First payment should succeed
    await request(app.getHttpServer())
      .post(`/api/rounds/${roundId}/payments`)
      .set('Cookie', cookies)
      .send({
        position_id: positionId,
        amount: 5000,
      })
      .expect(201);

    // Second payment for the same position/round should fail
    await request(app.getHttpServer())
      .post(`/api/rounds/${roundId}/payments`)
      .set('Cookie', cookies)
      .send({
        position_id: positionId,
        amount: 5000,
      })
      .expect(409);
  });

  it('POST /api/cycles/:id/rounds - should reject an ineligible manual draw', async () => {
    const timestamp = Date.now();
    const email = `draw-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register user
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Draw Tester',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    // Create ballot group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookies)
      .send({
        name: 'Draw Test Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'ballot',
      })
      .expect(201);

    const groupId = groupResponse.body.id;

    // Create three members and positions
    const positions: number[] = [];

    for (let i = 1; i <= 3; i++) {
      const memberResponse = await request(app.getHttpServer())
        .post(`/api/groups/${groupId}/members`)
        .set('Cookie', cookies)
        .send({
          full_name: `Draw Member ${i}`,
        })
        .expect(201);

      const positionResponse = await request(app.getHttpServer())
        .post(`/api/groups/${groupId}/positions`)
        .set('Cookie', cookies)
        .send({
          member_id: memberResponse.body.id,
        })
        .expect(201);

      positions.push(positionResponse.body.id);
    }

    const [position1, position2, position3] = positions;

    // Start cycle
    const cycleResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/cycles`)
      .set('Cookie', cookies)
      .expect(201);

    const cycleId = cycleResponse.body.id;

    // Round 1: manually select position 1
    const round1Response = await request(app.getHttpServer())
      .post(`/api/cycles/${cycleId}/rounds`)
      .set('Cookie', cookies)
      .send({
        method: 'manual_draw',
        collector_position_id: position1,
      })
      .expect(201);

    expect(round1Response.body.collectorPositionId).toBe(position1);

    // Complete Round 1 so position 1 becomes ineligible
    for (const positionId of positions) {
      await request(app.getHttpServer())
        .post(`/api/rounds/${round1Response.body.id}/payments`)
        .set('Cookie', cookies)
        .send({
          position_id: positionId,
          amount: 5000,
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post(`/api/rounds/${round1Response.body.id}/close`)
      .set('Cookie', cookies)
      .expect(201);

    // Verify position 1 is no longer eligible
    const eligibleResponse = await request(app.getHttpServer())
      .get(`/api/cycles/${cycleId}/eligible-positions`)
      .set('Cookie', cookies)
      .expect(200);

    const eligibleIds = eligibleResponse.body.map(
      (position: { id: number }) => position.id,
    );

    expect(eligibleIds).not.toContain(position1);
    expect(eligibleIds).toContain(position2);
    expect(eligibleIds).toContain(position3);

    // Try to manually select the already-collected position
    await request(app.getHttpServer())
      .post(`/api/cycles/${cycleId}/rounds`)
      .set('Cookie', cookies)
      .send({
        method: 'manual_draw',
        collector_position_id: position1,
      })
      .expect(400);
  });

  it('POST /api/rounds/:id/close - should keep round open when unpaid close is rejected', async () => {
    const timestamp = Date.now();
    const email = `close-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Close Test User',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    // Create group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookies)
      .send({
        name: 'Close Test Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'fixed',
      })
      .expect(201);

    const groupId = groupResponse.body.id;

    // Create member
    const memberResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/members`)
      .set('Cookie', cookies)
      .send({
        full_name: 'Close Member',
      })
      .expect(201);

    // Create position
    const positionResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/positions`)
      .set('Cookie', cookies)
      .send({
        member_id: memberResponse.body.id,
      })
      .expect(201);

    const positionId = positionResponse.body.id;

    // Set fixed order
    await request(app.getHttpServer())
      .put(`/api/groups/${groupId}/positions/order`)
      .set('Cookie', cookies)
      .send({
        position_ids: [positionId],
      })
      .expect(204);

    // Start cycle
    const cycleResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/cycles`)
      .set('Cookie', cookies)
      .expect(201);

    const cycleId = cycleResponse.body.id;

    // Open round
    const roundResponse = await request(app.getHttpServer())
      .post(`/api/cycles/${cycleId}/rounds`)
      .set('Cookie', cookies)
      .send({
        method: 'auto',
      })
      .expect(201);

    const roundId = roundResponse.body.id;

    // Attempt to close unpaid round without acknowledging shortfall
    await request(app.getHttpServer())
      .post(`/api/rounds/${roundId}/close`)
      .set('Cookie', cookies)
      .send({
        acknowledge_shortfall: false,
      })
      .expect(409);

    // Verify the round is still open
    const roundAfterFailure = await request(app.getHttpServer())
      .get(`/api/rounds/${roundId}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(roundAfterFailure.body.status).toBe('open');

    // Verify no payout was created
    const cycleSummary = await request(app.getHttpServer())
      .get(`/api/cycles/${cycleId}/summary`)
      .set('Cookie', cookies)
      .expect(200);

    expect(cycleSummary.body.rounds[0].payout).toBeFalsy();
  });

  it('should keep the books balanced across payments, fines, spending, and adjustments', async () => {
    const timestamp = Date.now();
    const email = `balance-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Balance Tester',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    // Create group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookies)
      .send({
        name: 'Balance Test Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'fixed',
      })
      .expect(201);

    const groupId = groupResponse.body.id;

    // Create member
    const memberResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/members`)
      .set('Cookie', cookies)
      .send({
        full_name: 'Balance Member',
      })
      .expect(201);

    const memberId = memberResponse.body.id;

    // Create position
    const positionResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/positions`)
      .set('Cookie', cookies)
      .send({
        member_id: memberId,
      })
      .expect(201);

    const positionId = positionResponse.body.id;

    // Set fixed order
    await request(app.getHttpServer())
      .put(`/api/groups/${groupId}/positions/order`)
      .set('Cookie', cookies)
      .send({
        position_ids: [positionId],
      })
      .expect(204);

    // Start cycle
    const cycleResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/cycles`)
      .set('Cookie', cookies)
      .expect(201);

    const cycleId = cycleResponse.body.id;

    // Open round
    const roundResponse = await request(app.getHttpServer())
      .post(`/api/cycles/${cycleId}/rounds`)
      .set('Cookie', cookies)
      .send({
        method: 'auto',
      })
      .expect(201);

    const roundId = roundResponse.body.id;

    // Record payment
    await request(app.getHttpServer())
      .post(`/api/rounds/${roundId}/payments`)
      .set('Cookie', cookies)
      .send({
        position_id: positionId,
        amount: 5000,
      })
      .expect(201);

    // Get default fine rules
    const rulesResponse = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/fine-rules`)
      .set('Cookie', cookies)
      .expect(200);

    const fineRule = rulesResponse.body[0];

    // Apply fine
    const fineResponse = await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/fines`)
      .set('Cookie', cookies)
      .send({
        member_id: memberId,
        rule_id: fineRule.id,
        amount: 1000,
        note: 'Balance test fine',
      })
      .expect(201);

    const fineId = fineResponse.body.id;

    // Pay fine → adds 1000 to fund
    await request(app.getHttpServer())
      .post(`/api/fines/${fineId}/pay`)
      .set('Cookie', cookies)
      .expect(201);

    // Add fund adjustment of +500
    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/adjustments`)
      .set('Cookie', cookies)
      .send({
        amount: 500,
        note: 'Balance test adjustment',
        affects_fund: true,
      })
      .expect(201);

    // Spend 300 from fund
    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/fund/spending`)
      .set('Cookie', cookies)
      .send({
        amount: 300,
        note: 'Balance test spending',
      })
      .expect(201);

    // Verify fund
    const fundResponse = await request(app.getHttpServer())
      .get(`/api/groups/${groupId}/fund`)
      .set('Cookie', cookies)
      .expect(200);

    expect(fundResponse.body.balance).toBe(1200);
  });

  it('GET /api/share/:code - should not expose member phone numbers', async () => {
    const timestamp = Date.now();
    const email = `share-${timestamp}@example.com`;
    const password = 'Password123!';

    // Register
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        full_name: 'Share Tester',
      })
      .expect(201);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];

    // Create group
    const groupResponse = await request(app.getHttpServer())
      .post('/api/groups')
      .set('Cookie', cookies)
      .send({
        name: 'Share Test Group',
        amount: 5000,
        frequency: 'monthly',
        start_date: '2026-09-21',
        order_mode: 'fixed',
      })
      .expect(201);

    const groupId = groupResponse.body.id;
    const shareCode = groupResponse.body.shareCode;

    // Create member with a phone number
    await request(app.getHttpServer())
      .post(`/api/groups/${groupId}/members`)
      .set('Cookie', cookies)
      .send({
        full_name: 'Private Member',
        phone: '677123456',
      })
      .expect(201);

    // Access public share page WITHOUT authentication
    const shareResponse = await request(app.getHttpServer())
      .get(`/api/share/${shareCode}`)
      .expect(200);

    // Share page should contain the member
    expect(JSON.stringify(shareResponse.body)).toContain('Private Member');

    // Phone number must never be exposed
    expect(JSON.stringify(shareResponse.body)).not.toContain('677123456');
  });
});
