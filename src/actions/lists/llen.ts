import { Redis } from 'ioredis';

export const llenAction = {
  name: 'lists.llen',
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
    const result = await redis.llen(key);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get the length of a list',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mylist"}\' http://localhost:3001/api/v1/lists/llen',
      response: { result: 4 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get the number of elements in the list "mylist"?',
    },
  ],
};
