import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

import { registerPubSubRoutes } from '../src/routes/pubsub';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Pub/Sub routes', () => {
  let context: TestContext;
  let redis: Redis;

  beforeAll(async () => {
    context = await buildTestContext(registerPubSubRoutes);
    redis = context.redis;
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    await resetRedis(redis);
  });

  it('should publish messages to a channel', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/pubsub/publish`)
      .send({ channel: 'updates', message: 'hello' })
      .expect(200);

    expect(response.body).toEqual({ status: 'OK', channel: 'updates', message: 'hello', receivers: 0 });
  });

  it('should validate the payload when publishing', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/pubsub/publish`)
      .send({ channel: '', message: '' })
      .expect(400);

    expect(response.body).toEqual({ error: 'Os campos "channel" e "message" são obrigatórios' });
  });
});
