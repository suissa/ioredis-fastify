import { Redis } from 'ioredis';

export const lrangeAction = {
  name: 'lists.lrange',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        start: { type: 'number' },
        stop: { type: 'number' },
      },
      required: ['key', 'start', 'stop'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, start, stop } = request.body;
    const result = await redis.lrange(key, start, stop);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get a range of elements from a list',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mylist","start":0,"stop":-1}\' http://localhost:3001/api/v1/lists/lrange',
      response: { result: ["b", "a", "c", "d"] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get all the elements from the list "mylist"?',
    },
  ],
};
