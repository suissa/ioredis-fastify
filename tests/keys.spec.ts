import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerKeyRoutes } from '../src/routes/keys';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Key routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerKeyRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should report the data type of a stored key', async () => {
    await redis.set('example', '42');

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/keys/example/type`)
      .expect(200);

    expect(response.body).toEqual({ key: 'example', type: 'string' });
  });

  it('should count how many of the provided keys exist', async () => {
    await redis.set('existing', 'value');

    const response = await request(context.app.server)
      .post(`${API_PREFIX}/keys/exists`)
      .send({ keys: ['existing', 'missing'] })
      .expect(200);

    expect(response.body).toEqual({ existing_keys_count: 1 });
  });

  it('should validate the request body when checking key existence', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/keys/exists`)
      .send({ keys: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "keys"' });
  });

  it('should rename an existing key', async () => {
    await redis.set('oldKey', 'important');

    const response = await request(context.app.server)
      .post(`${API_PREFIX}/keys/oldKey/rename`)
      .send({ newKey: 'newKey' })
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      message: "Chave 'oldKey' renomeada para 'newKey'",
    });

    const renamedValue = await redis.get('newKey');
    expect(renamedValue).toBe('important');
  });

  it('should return not found when trying to rename a missing key', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/keys/missing/rename`)
      .send({ newKey: 'newKey' })
      .expect(404);

    expect(response.body).toEqual({ error: 'Chave de origem não encontrada' });
  });
});
