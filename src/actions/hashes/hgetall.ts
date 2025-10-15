import { Redis } from 'ioredis';

export const hgetallAction = {
  name: 'hashes.hgetall',
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
    const result = await redis.hgetall(key);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get all fields and values in a hash',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myhash"}\' http://localhost:3001/api/v1/hashes/hgetall',
      response: { result: { myfield: "myvalue" } },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get all the fields and values from the hash "myhash"?',
    },
  ],
};
