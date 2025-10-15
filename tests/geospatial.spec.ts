import request from 'supertest';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastify as app, loadActions, registerRoutes } from '../src/mcp_server';

import { API_PREFIX, resetRedis } from './helpers';

describe('Geospatial Actions', () => {
  let redis: Redis;
  let geoaddMock: ReturnType<typeof vi.fn>;
  let georadiusMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    const RedisMock = (await import('ioredis-mock')).default;
    redis = new RedisMock() as unknown as Redis;
    geoaddMock = vi.fn().mockResolvedValue(2);
    georadiusMock = vi.fn().mockResolvedValue([
      ['lisbon', '1.23', ['-9.1399', '38.7223']],
    ]);
    (redis as any).geoadd = geoaddMock;
    (redis as any).georadius = georadiusMock;

    await loadActions();
    registerRoutes(redis);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    geoaddMock.mockClear();
    georadiusMock.mockClear();
    await resetRedis(redis);
  });

  it('should add geospatial locations', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/geospatial/geoadd`)
      .send({
        key: 'cities',
        locations: [
          { longitude: -9.1399, latitude: 38.7223, member: 'lisbon' },
          { longitude: -8.6291, latitude: 41.1579, member: 'porto' },
        ],
      })
      .expect(201);

    expect(response.body).toEqual({ status: 'OK', locationsAdded: 2 });
    expect(geoaddMock).toHaveBeenCalledWith(
      'cities',
      -9.1399,
      38.7223,
      'lisbon',
      -8.6291,
      41.1579,
      'porto',
    );
  });

  it('should perform radius queries with optional flags', async () => {
    const response = await request(app.server)
      .post(`${API_PREFIX}/geospatial/georadius`)
      .send({ key: 'cities', lon: -9.0, lat: 38.7, radius: 200, unit: 'km', withdist: true, withcoord: true, count: 5 })
      .expect(200);

    expect(response.body).toEqual({ results: [['lisbon', '1.23', ['-9.1399', '38.7223']]] });
    expect(georadiusMock).toHaveBeenCalledWith('cities', -9.0, 38.7, 200, 'km', 'WITHDIST', 'WITHCOORD', 'COUNT', 5);
  });
});
