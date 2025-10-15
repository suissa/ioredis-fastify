import { Redis } from 'ioredis';

export const sremAction = {
  name: 'sets.srem',
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
    const result = await redis.srem(key, ...members);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Remove one or more members from a set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myset","members":["a"]}\' http://localhost:3001/api/v1/sets/srem',
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
      content: 'How can I remove the member "a" from the set "myset"?',
    },
  ],
};
