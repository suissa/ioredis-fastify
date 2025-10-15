import { Redis } from 'ioredis';

export const bitcountAction = {
  name: 'bitmaps.bitcount',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
      },
      required: ['key'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key } = request.body;
    const count = await redis.bitcount(key);
    reply.send({ key, count });
  },
  examples: [
    {
      description: 'Count the number of set bits (1s) in a bitmap',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mybitmap"}\' http://localhost:3001/api/v1/bitmaps/bitcount',
      response: { key: 'mybitmap', count: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I count the number of set bits for the key "mybitmap"?',
    },
  ],
};
