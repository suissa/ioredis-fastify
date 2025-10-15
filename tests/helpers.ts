import type { Redis } from 'ioredis';

export const API_PREFIX = '/api/v1';

export async function resetRedis(redis: Redis) {
  if (typeof (redis as any).flushall === 'function') {
    await (redis as any).flushall();
  }
}
