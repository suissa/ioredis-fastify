import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Sorted Set Actions', () => {
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

  it('should add scored members to a sorted set', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/sortedSets/zadd`)
      .send({ key: 'leaderboard', members: [{ score: 10, member: 'alice' }, { score: 20, member: 'bob' }] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', membersAdded: 2 });
  });

  it('should list members with their scores', async () => {
    await redis.zadd('leaderboard', 10, 'alice', 20, 'bob');

    const response = await request(app.server)
      .post(`${API_PREFIX}/sortedSets/zrange`)
      .send({ key: 'leaderboard', start: 0, stop: -1 })
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

    const response = await request(app.server)
      .post(`${API_PREFIX}/sortedSets/zrem`)
      .send({ key: 'leaderboard', members: ['alice'] })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', membersRemoved: 1 });

    const remaining = await redis.zrange('leaderboard', 0, -1);
    expect(remaining).toEqual(['bob']);
  });
});
