import { Redis } from 'ioredis';

export const rpushAction = {
  name: 'lists.rpush',
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
    const result = await redis.rpush(key, ...values);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Append one or more values to a list',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mylist","values":["c","d"]}\' http://localhost:3001/api/v1/lists/rpush',
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
      content: 'How can I add the values "c" and "d" to the end of the list "mylist"?',
    },
  ],
};
