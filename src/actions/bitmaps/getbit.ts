import { Redis } from 'ioredis';

export const getbitAction = {
  name: 'bitmaps.getbit',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        offset: { type: 'number' },
      },
      required: ['key', 'offset'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, offset } = request.body;
    const value = await redis.getbit(key, offset);
    reply.send({ key, offset, value });
  },
  examples: [
    {
      description: 'Get the value of a bit at a specific offset',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mybitmap","offset":10}\' http://localhost:3001/api/v1/bitmaps/getbit',
      response: { key: 'mybitmap', offset: 10, value: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get the value of the bit at offset 10 for the key "mybitmap"?',
    },
  ],
};
