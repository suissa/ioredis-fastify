import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerBitmapRoutes } from '../src/routes/bitmaps';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Bitmap routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerBitmapRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should set and return the previous value of a bit', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/bitmaps/flags/0`)
      .send({ value: 1 })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', originalValue: 0 });

    const getResponse = await request(context.app.server)
      .get(`${API_PREFIX}/bitmaps/flags/0`)
      .expect(200);

    expect(getResponse.body).toEqual({ key: 'flags', offset: '0', value: 1 });
  });

  it('should validate bit values', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/bitmaps/flags/0`)
      .send({ value: 2 })
      .expect(400);

    expect(response.body).toEqual({ error: 'O valor deve ser 0 ou 1' });
  });

  it('should count the number of bits set to 1', async () => {
    await request(context.app.server)
      .post(`${API_PREFIX}/bitmaps/flags/1`)
      .send({ value: 1 })
      .expect(200);
    await request(context.app.server)
      .post(`${API_PREFIX}/bitmaps/flags/3`)
      .send({ value: 1 })
      .expect(200);

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/bitmaps/flags/count`)
      .expect(200);

    expect(response.body).toEqual({ key: 'flags', count: 2 });
  });
});
