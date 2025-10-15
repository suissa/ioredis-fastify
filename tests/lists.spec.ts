import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerListRoutes } from '../src/routes/lists';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('List routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerListRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should append elements to the end of a list', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/lists/tasks`)
      .send({ values: ['write', 'test'] })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', listLength: 2 });

    const stored = await redis.lrange('tasks', 0, -1);
    expect(stored).toEqual(['"write"', '"test"']);
  });

  it('should prepend elements when direction is left', async () => {
    await redis.rpush('tasks', '"existing"');

    const response = await request(context.app.server)
      .post(`${API_PREFIX}/lists/tasks`)
      .send({ values: ['new'], direction: 'left' })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', listLength: 2 });

    const stored = await redis.lrange('tasks', 0, -1);
    expect(stored).toEqual(['"new"', '"existing"']);
  });

  it('should validate the payload when pushing to a list', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/lists/tasks`)
      .send({ values: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "values" não vazio' });
  });

  it('should read a range of list items', async () => {
    await redis.rpush('tasks', '"one"', '"two"', '"three"');

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/lists/tasks`)
      .query({ start: 1, stop: 2 })
      .expect(200);

    expect(response.body).toEqual({ key: 'tasks', list: ['"two"', '"three"'] });
  });
});
