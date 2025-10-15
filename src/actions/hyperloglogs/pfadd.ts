import { Redis } from 'ioredis';

export const pfaddAction = {
  name: 'hyperloglogs.pfadd',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        elements: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['key', 'elements'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, elements } = request.body;
    const result = await redis.pfadd(key, ...elements);
    reply.code(201).send({ status: 'OK', updated: result === 1 });
  },
  examples: [
    {
      description: 'Add elements to a HyperLogLog',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"hll","elements":["a","b","c"]}\' http://localhost:3001/api/v1/hyperloglogs/pfadd',
      response: { status: 'OK', updated: true },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I add the elements "a", "b", and "c" to the HyperLogLog "hll"?',
    },
  ],
};
