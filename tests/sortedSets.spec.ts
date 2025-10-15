import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerSortedSetRoutes } from '../src/routes/sortedSets';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Sorted set routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerSortedSetRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should add scored members to a sorted set', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/sorted-sets/leaderboard`)
      .send({ members: [{ score: 10, member: 'alice' }, { score: 20, member: 'bob' }] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', membersAdded: 2 });
  });

  it('should validate the payload when adding to a sorted set', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/sorted-sets/leaderboard`)
      .send({ members: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "members"' });
  });

  it('should list members with their scores', async () => {
    await redis.zadd('leaderboard', 10, 'alice', 20, 'bob');

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/sorted-sets/leaderboard`)
      .query({ start: 0, stop: -1 })
      .expect(200);

    expect(response.body).toEqual({
      key: 'leaderboard',
      members: [
        { member: 'alice', score: 10 },
        { member: 'bob', score: 20 },
      ],
    });
  });

  it('should remove members from a sorted set', async () => {
    await redis.zadd('leaderboard', 10, 'alice', 20, 'bob');

    const response = await request(context.app.server)
      .delete(`${API_PREFIX}/sorted-sets/leaderboard`)
      .send({ members: ['alice'] })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', membersRemoved: 1 });

    const remaining = await redis.zrange('leaderboard', 0, -1);
    expect(remaining).toEqual(['bob']);
  });
});
