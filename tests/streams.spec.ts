import request from 'supertest';
import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerStreamRoutes } from '../src/routes/streams';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Stream routes', () => {
  let context: TestContext;
  let redis: Redis;
  let xaddMock: ReturnType<typeof vi.fn>;
  let xrangeMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    redis = new RedisMock() as unknown as Redis;
    xaddMock = vi.fn().mockResolvedValue('1-0');
    xrangeMock = vi.fn().mockResolvedValue([
      ['1-0', ['field', 'value']],
    ]);
    (redis as any).xadd = xaddMock;
    (redis as any).xrange = xrangeMock;
    context = await buildTestContext(registerStreamRoutes, redis);
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    xaddMock.mockClear();
    xrangeMock.mockClear();
    await resetRedis(redis);
  });

  it('should add entries to a stream', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/streams/activity`)
      .send({ field: 'value' })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', messageId: '1-0' });
    expect(xaddMock).toHaveBeenCalledWith('activity', '*', 'field', 'value');
  });

  it('should reject empty payloads when adding to a stream', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/streams/activity`)
      .send({})
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve ser um objeto com dados' });
    expect(xaddMock).not.toHaveBeenCalled();
  });

  it('should list stream entries in a friendly format', async () => {
    const response = await request(context.app.server)
      .get(`${API_PREFIX}/streams/activity`)
      .query({ count: 10 })
      .expect(200);

    expect(response.body).toEqual({
      key: 'activity',
      entries: [
        { id: '1-0', data: { field: 'value' } },
      ],
    });
    expect(xrangeMock).toHaveBeenCalledWith('activity', '-', '+', 'COUNT', '10');
  });
});
