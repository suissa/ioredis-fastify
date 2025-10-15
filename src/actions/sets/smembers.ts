import { Redis } from 'ioredis';

export const smembersAction = {
  name: 'sets.smembers',
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
    const result = await redis.smembers(key);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get all the members in a set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myset"}\' http://localhost:3001/api/v1/sets/smembers',
      response: { result: ["b"] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get all the members of the set "myset"?',
    },
  ],
};
