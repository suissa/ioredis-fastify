import { Redis } from 'ioredis';

export const hdelAction = {
  name: 'hashes.hdel',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        field: { type: 'string' },
      },
      required: ['key', 'field'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, field } = request.body;
    const result = await redis.hdel(key, field);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Delete a field from a hash',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myhash","field":"myfield"}\' http://localhost:3001/api/v1/hashes/hdel',
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
      content: 'How can I delete the field "myfield" from the hash "myhash"?',
    },
  ],
};
