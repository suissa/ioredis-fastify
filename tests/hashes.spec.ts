import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Hash Actions', () => {
  let redis: Redis;

  beforeAll(async () => {
    // Manually create a mock Redis instance
    const RedisMock = (await import('ioredis-mock')).default;
    redis = new RedisMock() as unknown as Redis;

    // Load actions and register routes with the mock Redis
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

  it('should create or update fields in a hash', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/hashes/hset`)
      .send({ key: 'user:1', field: 'name', value: 'Ada' })
      .expect(200);

    expect(response.body).toEqual({ result: 1 });

    const stored = await redis.hgetall('user:1');
    expect(stored).toEqual({ name: 'Ada' });
  });

  it('should fetch all fields from an existing hash', async () => {
    await redis.hset('user:1', { name: 'Ada' });

    const response = await request(app.server)
      .post(`${API_PREFIX}/hashes/hgetall`)
      .send({ key: 'user:1' })
      .expect(200);

    expect(response.body).toEqual({ result: { name: 'Ada' } });
  });
});
