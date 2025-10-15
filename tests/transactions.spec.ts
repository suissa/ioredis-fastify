import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Transaction Actions', () => {
  let redis: Redis;

  beforeAll(async () => {
    const RedisMock = (await import('ioredis-mock')).default;
    redis = new RedisMock() as unknown as Redis;

    await loadActions();
    registerRoutes(redis);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should execute multiple commands atomically', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/transactions/exec`)
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
});
