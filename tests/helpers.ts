import Fastify, { FastifyInstance } from 'fastify';
import RedisMock from 'ioredis-mock';
import type { Redis } from 'ioredis';

export const API_PREFIX = '/api/v1';

export interface TestContext {
  app: FastifyInstance;
  redis: Redis;
}

export async function buildTestContext(
  registerRoutes: (app: FastifyInstance, redis: Redis) => void,
  redisInstance?: Redis,
): Promise<TestContext> {
  const redis = redisInstance ?? (new RedisMock() as unknown as Redis);
  const app = Fastify();

  app.register((instance, _opts, done) => {
    try {
      registerRoutes(instance, redis);
      done();
    } catch (error) {
      done(error as Error);
    }
  }, { prefix: API_PREFIX });

  await app.ready();

  return { app, redis };
}

export async function closeTestContext(context: TestContext) {
  const { app, redis } = context;
  if (typeof (redis as any).quit === 'function') {
    await (redis as any).quit();
  }
  await app.close();
}

export async function resetRedis(redis: Redis) {
  if (typeof (redis as any).flushall === 'function') {
    await (redis as any).flushall();
  }
}
