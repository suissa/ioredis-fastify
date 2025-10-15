import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('HyperLogLog Actions', () => {
  let redis: Redis;
  let pfaddMock: ReturnType<typeof vi.fn>;
  let pfcountMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    const RedisMock = (await import('ioredis-mock')).default;
    redis = new RedisMock() as unknown as Redis;
    pfaddMock = vi.fn().mockResolvedValue(1);
    pfcountMock = vi.fn().mockResolvedValue(42);
    (redis as any).pfadd = pfaddMock;
    (redis as any).pfcount = pfcountMock;

    await loadActions();
    registerRoutes(redis);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    pfaddMock.mockClear();
    pfcountMock.mockClear();
    await resetRedis(redis);
  });

  it('should add elements to a HyperLogLog', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/hyperloglogs/pfadd`)
      .send({ key: 'visitors', elements: ['alice', 'bob'] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', updated: true });
    expect(pfaddMock).toHaveBeenCalledWith('visitors', 'alice', 'bob');
  });

  it('should return approximate cardinality for provided keys', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/hyperloglogs/pfcount`)
      .send({ keys: ['visitors', 'other'] })
      .expect(200);

    expect(response.body).toEqual({ keys: ['visitors', 'other'], approximate_cardinality: 42 });
    expect(pfcountMock).toHaveBeenCalledWith('visitors', 'other');
  });
});
