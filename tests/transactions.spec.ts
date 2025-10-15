import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerTransactionRoutes } from '../src/routes/transactions';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Transaction routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerTransactionRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should execute multiple commands atomically', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/transaction`)
      .send({
        commands: [
          { command: 'set', args: ['user:1', 'Ada'] },
          { command: 'get', args: ['user:1'] },
        ],
      })
      .expect(200);

    expect(response.body).toEqual({
      results: [
        { error: null, result: 'OK' },
        { error: null, result: 'Ada' },
      ],
    });
  });

  it('should validate the commands array', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/transaction`)
      .send({ commands: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "commands"' });
  });

  it('should report errors for invalid commands', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/transaction`)
      .send({
        commands: [
          { command: 'invalid', args: [] },
        ],
      })
      .expect(500);

    expect(response.body).toEqual({
      error: 'Erro ao executar a transação',
      details: 'Comando Redis inválido: invalid',
    });
  });
});
