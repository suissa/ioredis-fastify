import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Set Actions', () => {
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

  it('should add members to a set', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/sets/sadd`)
      .send({ key: 'colors', members: ['red', 'blue'] })
      .expect(200);

    expect(response.body).toEqual({ result: 2 });

    const stored = await redis.smembers('colors');
    expect(new Set(stored)).toEqual(new Set(['red', 'blue']));
  });

  it('should list the members of a set', async () => {
    await redis.sadd('colors', 'red', 'green');

    const response = await request(app.server)
      .post(`${API_PREFIX}/sets/smembers`)
      .send({ key: 'colors' })
      .expect(200);

    expect(new Set(response.body.result)).toEqual(new Set(['red', 'green']));
  });

  it('should remove members from a set', async () => {
    await redis.sadd('colors', 'red', 'green');

    const response = await request(app.server)
      .post(`${API_PREFIX}/sets/srem`)
      .send({ key: 'colors', members: ['red'] })
      .expect(200);

    expect(response.body).toEqual({ result: 1 });

    const stored = await redis.smembers('colors');
    expect(stored).toEqual(['green']);
  });
});
