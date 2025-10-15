import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Pipeline Actions', () => {
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

  it('should execute commands in a pipeline', async () => {
    await redis.set('user:1', 'Grace');

    const response = await request(app.server)
      .post(`${API_PREFIX}/pipelining/exec`)
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
});
