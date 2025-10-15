import { Redis } from 'ioredis';

export const scardAction = {
  name: 'sets.scard',
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
    const result = await redis.scard(key);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get the number of members in a set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myset"}\' http://localhost:3001/api/v1/sets/scard',
      response: { result: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get the number of members in the set "myset"?',
    },
  ],
};
