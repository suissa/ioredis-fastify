import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerPipelineRoutes } from '../src/routes/pipelining';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Pipeline routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerPipelineRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should execute commands in a pipeline', async () => {
    await redis.set('user:1', 'Grace');

    const response = await request(context.app.server)
      .post(`${API_PREFIX}/pipeline`)
      .send({
        commands: [
          { command: 'get', args: ['user:1'] },
          { command: 'set', args: ['user:2', 'Ada'] },
        ],
      })
      .expect(200);

    expect(response.body).toEqual({
      results: [
        { error: null, result: 'Grace' },
        { error: null, result: 'OK' },
      ],
    });
  });

  it('should validate the commands array', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/pipeline`)
      .send({ commands: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "commands"' });
  });

  it('should report errors for invalid pipeline commands', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/pipeline`)
      .send({ commands: [{ command: 'invalid', args: [] }] })
      .expect(500);

    expect(response.body).toEqual({
      error: 'Erro ao executar o pipeline',
      details: 'Comando Redis inválido: invalid',
    });
  });
});
