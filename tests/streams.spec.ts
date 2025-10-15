import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Stream Actions', () => {
  let redis: Redis;
  let xaddMock: ReturnType<typeof vi.fn>;
  let xrangeMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    const RedisMock = (await import('ioredis-mock')).default;
    redis = new RedisMock() as unknown as Redis;
    xaddMock = vi.fn().mockResolvedValue('1-0');
    xrangeMock = vi.fn().mockResolvedValue([
      ['1-0', ['field', 'value']],
    ]);
    (redis as any).xadd = xaddMock;
    (redis as any).xrange = xrangeMock;

    await loadActions();
    registerRoutes(redis);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    xaddMock.mockClear();
    xrangeMock.mockClear();
    await resetRedis(redis);
  });

  it('should add entries to a stream', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/streams/xadd`)
      .send({ key: 'activity', data: { field: 'value' } })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', messageId: '1-0' });
    expect(xaddMock).toHaveBeenCalledWith('activity', '*', 'field', 'value');
  });

  it('should list stream entries in a friendly format', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/streams/xrange`)
      .send({ key: 'activity', start: '-', end: '+', count: 10 })
      .expect(200);

    expect(response.body).toEqual({
      key: 'activity',
      entries: [
        { id: '1-0', data: { field: 'value' } },
      ],
    });
    expect(xrangeMock).toHaveBeenCalledWith('activity', '-', '+', 'COUNT', 10);
  });
});
