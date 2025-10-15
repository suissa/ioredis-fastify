import { Redis } from 'ioredis';

export const saddAction = {
  name: 'sets.sadd',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        members: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['key', 'members'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, members } = request.body;
    const result = await redis.sadd(key, ...members);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Add one or more members to a set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myset","members":["a","b"]}\' http://localhost:3001/api/v1/sets/sadd',
      response: { result: 2 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I add the members "a" and "b" to the set "myset"?',
    },
  ],
};
