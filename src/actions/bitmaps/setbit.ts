import { Redis } from 'ioredis';

export const setbitAction = {
  name: 'bitmaps.setbit',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        offset: { type: 'number' },
        value: { type: 'number', enum: [0, 1] },
      },
      required: ['key', 'offset', 'value'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, offset, value } = request.body;
    const originalValue = await redis.setbit(key, offset, value);
    reply.send({ status: 'OK', originalValue });
  },
  examples: [
    {
      description: 'Set a bit at a specific offset',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mybitmap","offset":10,"value":1}\' http://localhost:3001/api/v1/bitmaps/setbit',
      response: { status: 'OK', originalValue: 0 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I set the bit at offset 10 to 1 for the key "mybitmap"?',
    },
  ],
};
