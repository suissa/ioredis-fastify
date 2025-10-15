import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('List Actions', () => {
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

  it('should append elements to the end of a list', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/lists/rpush`)
      .send({ key: 'tasks', values: ['write', 'test'] })
      .expect(200);

    expect(response.body).toEqual({ result: 2 });

    const stored = await redis.lrange('tasks', 0, -1);
    expect(stored).toEqual(['write', 'test']);
  });

  it('should prepend elements to the beginning of a list', async () => {
    await redis.rpush('tasks', 'existing');

    const response = await request(app.server)
      .post(`${API_PREFIX}/lists/lpush`)
      .send({ key: 'tasks', values: ['new'] })
      .expect(200);

    expect(response.body).toEqual({ result: 2 });

    const stored = await redis.lrange('tasks', 0, -1);
    expect(stored).toEqual(['new', 'existing']);
  });

  it('should read a range of list items', async () => {
    await redis.rpush('tasks', 'one', 'two', 'three');

    const response = await request(app.server)
      .post(`${API_PREFIX}/lists/lrange`)
      .send({ key: 'tasks', start: 1, stop: 2 })
      .expect(200);

    expect(response.body).toEqual({ result: ['two', 'three'] });
  });
});
