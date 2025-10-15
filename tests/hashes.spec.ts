import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerHashRoutes } from '../src/routes/hashes';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Hash routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerHashRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should create or update fields in a hash', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/hashes/user:1`)
      .send({ name: 'Ada', language: 'TypeScript' })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', fieldsAdded: 2 });

    const stored = await redis.hgetall('user:1');
    expect(stored).toEqual({ name: 'Ada', language: 'TypeScript' });
  });

  it('should validate the payload when setting hash fields', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/hashes/user:1`)
      .send({})
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo da requisição deve ser um objeto não vazio' });
  });

  it('should return 404 when the requested hash does not exist', async () => {
    const response = await request(context.app.server)
      .get(`${API_PREFIX}/hashes/user:missing`)
      .expect(404);

    expect(response.body).toEqual({ error: 'Chave de hash não encontrada' });
  });

  it('should fetch all fields from an existing hash', async () => {
    await redis.hset('user:1', { name: 'Ada' });

    const response = await request(context.app.server)
      .get(`${API_PREFIX}/hashes/user:1`)
      .expect(200);

    expect(response.body).toEqual({ name: 'Ada' });
  });
});
