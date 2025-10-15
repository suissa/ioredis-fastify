import request from 'supertest';
import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerGeospatialRoutes } from '../src/routes/geospatial';
import { API_PREFIX, buildTestContext, closeTestContext, resetRedis, TestContext } from './helpers';

describe('Geospatial routes', () => {
  let context: TestContext;
  let redis: Redis;
  let geoaddMock: ReturnType<typeof vi.fn>;
  let georadiusMock: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    redis = new RedisMock() as unknown as Redis;
    geoaddMock = vi.fn().mockResolvedValue(2);
    georadiusMock = vi.fn().mockResolvedValue([
      ['lisbon', '1.23', ['-9.1399', '38.7223']],
    ]);
    (redis as any).geoadd = geoaddMock;
    (redis as any).georadius = georadiusMock;
    context = await buildTestContext(registerGeospatialRoutes, redis);
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  beforeEach(async () => {
    geoaddMock.mockClear();
    georadiusMock.mockClear();
    await resetRedis(redis);
  });

  it('should add geospatial locations', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/geo/cities`)
      .send({
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

  it('should reject invalid geospatial payloads', async () => {
    const response = await request(context.app.server)
      .post(`${API_PREFIX}/geo/cities`)
      .send({ locations: [] })
      .expect(400);

    expect(response.body).toEqual({ error: 'O corpo deve conter um array "locations"' });
    expect(geoaddMock).not.toHaveBeenCalled();
  });

  it('should perform radius queries with optional flags', async () => {
    const response = await request(context.app.server)
      .get(`${API_PREFIX}/geo/cities/radius`)
      .query({ lon: -9.0, lat: 38.7, radius: 200, unit: 'km', withdist: true, withcoord: true, count: 5 })
      .expect(200);

    expect(response.body).toEqual({ results: [['lisbon', '1.23', ['-9.1399', '38.7223']]] });
    expect(georadiusMock).toHaveBeenCalledWith('cities', '-9', '38.7', '200', 'km', 'WITHDIST', 'WITHCOORD', 'COUNT', '5');
  });
});
