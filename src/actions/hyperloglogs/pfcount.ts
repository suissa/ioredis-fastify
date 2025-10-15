import { Redis } from 'ioredis';

export const pfcountAction = {
  name: 'hyperloglogs.pfcount',
  schema: {
    body: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['keys'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { keys } = request.body;
    const count = await redis.pfcount(...keys);
    reply.send({ keys, approximate_cardinality: count });
  },
  examples: [
    {
      description: 'Count the approximate cardinality of one or more HyperLogLogs',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"keys":["hll"]}\' http://localhost:3001/api/v1/hyperloglogs/pfcount',
      response: { keys: ["hll"], approximate_cardinality: 3 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get the approximate number of unique elements in the HyperLogLog "hll"?',
    },
  ],
};
