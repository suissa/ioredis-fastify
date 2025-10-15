import request from 'supertest';
import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerHyperLogLogRoutes } from '../src/routes/hyperloglogs';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('HyperLogLog routes', () => {
  let context: TestContext;
  let redis: Redis;
  let pfaddMock: ReturnType<typeof vi.fn>;
  let pfcountMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    redis = new RedisMock() as unknown as Redis;
    pfaddMock = vi.fn().mockResolvedValue(1);
    pfcountMock = vi.fn().mockResolvedValue(42);
    (redis as any).pfadd = pfaddMock;
    (redis as any).pfcount = pfcountMock;
    context = await buildTestContext(registerHyperLogLogRoutes, redis);
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    pfaddMock.mockClear();
    pfcountMock.mockClear();
    await resetRedis(redis);
  });

  it('should add elements to a HyperLogLog', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/hyperloglogs/visitors`)
      .send({ elements: ['alice', 'bob'] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', updated: true });
    expect(pfaddMock).toHaveBeenCalledWith('visitors', 'alice', 'bob');
  });

  it('should validate the payload when adding elements', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/hyperloglogs/visitors`)
      .send({ elements: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "elements"' });
    expect(pfaddMock).not.toHaveBeenCalled();
  });

  it('should return approximate cardinality for provided keys', async () => {
    const response = await request(context.app.server)
      .get(`${API_PREFIX}/hyperloglogs/count`)
      .query({ keys: 'visitors,other' })
      .expect(200);

    expect(response.body).toEqual({ keys: ['visitors', 'other'], approximate_cardinality: 42 });
    expect(pfcountMock).toHaveBeenCalledWith('visitors', 'other');
  });

  it('should require the keys query parameter', async () => {
    const response = await request(context.app.server)
      .get(`${API_PREFIX}/hyperloglogs/count`)
      .expect(400);

    expect(response.body).toEqual({ error: 'A query string "keys" é obrigatória' });
  });
});
