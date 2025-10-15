import Fastify, { FastifyInstance } from 'fastify';
import request from 'supertest';
import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';

import { registerKeyRoutes } from '../src/routes/keys';

const API_PREFIX = '/api/v1';

describe('Key routes', () => {
  let app: FastifyInstance;
  let redis: Redis;

  beforeAll(async () => {
    redis = new RedisMock() as unknown as Redis;

    app = Fastify();
    app.register((instance, _opts, done) => {
      registerKeyRoutes(instance, redis);
      done();
    }, { prefix: API_PREFIX });

    await app.ready();
  });

  afterAll(async () => {
    await redis.quit();
    await app.close();
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  it('should count how many of the provided keys exist', async () => {
    await redis.set('existing', 'value');

    const response = await request(app.server)
      .post(`${API_PREFIX}/keys/exists`)
      .send({ keys: ['existing', 'missing'] })
      .expect(200);

    expect(response.body).toEqual({ existing_keys_count: 1 });
  });

  it('should validate the request body when checking key existence', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/keys/exists`)
      .send({ keys: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "keys"' });
  });

  it('should rename an existing key', async () => {
    await redis.set('oldKey', 'important');

    const response = await request(app.server)
      .post(`${API_PREFIX}/keys/oldKey/rename`)
      .send({ newKey: 'newKey' })
      .expect(200);

    expect(response.body).toEqual({
      status: 'OK',
      message: "Chave 'oldKey' renomeada para 'newKey'"
    });

    const renamedValue = await redis.get('newKey');
    expect(renamedValue).toBe('important');
  });

  it('should return not found when trying to rename a missing key', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/keys/missing/rename`)
      .send({ newKey: 'newKey' })
      .expect(404);

    expect(response.body).toEqual({ error: 'Chave de origem não encontrada' });
  });
});
