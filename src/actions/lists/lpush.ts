import { Redis } from 'ioredis';

export const lpushAction = {
  name: 'lists.lpush',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        values: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['key', 'values'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, values } = request.body;
    const result = await redis.lpush(key, ...values);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Prepend one or more values to a list',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mylist","values":["a","b"]}\' http://localhost:3001/api/v1/lists/lpush',
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
      content: 'How can I add the values "a" and "b" to the beginning of the list "mylist"?',
    },
  ],
};
