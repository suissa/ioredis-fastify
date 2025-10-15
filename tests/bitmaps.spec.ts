import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Bitmap Actions', () => {
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

  it('should set and return the previous value of a bit', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/bitmaps/setbit`)
      .send({ key: 'flags', offset: 0, value: 1 })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', originalValue: 0 });

    const getResponse = await request(app.server)
      .post(`${API_PREFIX}/bitmaps/getbit`)
      .send({ key: 'flags', offset: 0 })
      .expect(200);

    expect(getResponse.body).toEqual({ key: 'flags', offset: 0, value: 1 });
  });

  it('should count the number of bits set to 1', async () => {
    await request(app.server)
      .post(`${API_PREFIX}/bitmaps/setbit`)
      .send({ key: 'flags', offset: 1, value: 1 })
      .expect(200);
    await request(app.server)
      .post(`${API_PREFIX}/bitmaps/setbit`)
      .send({ key: 'flags', offset: 3, value: 1 })
      .expect(200);

    const response = await request(app.server)
      .post(`${API_PREFIX}/bitmaps/bitcount`)
      .send({ key: 'flags' })
      .expect(200);

    expect(response.body).toEqual({ key: 'flags', count: 2 });
  });
});
