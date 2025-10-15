import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Pub/Sub Actions', () => {
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

  it('should publish messages to a channel', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/pubsub/publish`)
      .send({ channel: 'updates', message: 'hello' })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', channel: 'updates', message: 'hello', receivers: 0 });
  });
});
