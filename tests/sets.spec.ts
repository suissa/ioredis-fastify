import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerSetRoutes } from '../src/routes/sets';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Set routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerSetRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should add members to a set', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/sets/colors`)
      .send({ members: ['red', 'blue'] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', membersAdded: 2 });

    const stored = await redis.smembers('colors');
    expect(new Set(stored)).toEqual(new Set(['red', 'blue']));
  });

  it('should validate the payload when adding to a set', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/sets/colors`)
      .send({ members: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "members" não vazio' });
  });

  it('should list the members of a set', async () => {
    await redis.sadd('colors', 'red', 'green');

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/sets/colors`)
      .expect(200);

    expect(new Set(response.body.members)).toEqual(new Set(['red', 'green']));
  });

  it('should remove members from a set', async () => {
    await redis.sadd('colors', 'red', 'green');

    const response = await request(context.app.server)
      .delete(`${API_PREFIX}/sets/colors`)
      .send({ members: ['red'] })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', membersRemoved: 1 });

    const stored = await redis.smembers('colors');
    expect(stored).toEqual(['green']);
  });
});
