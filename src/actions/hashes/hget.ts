import { Redis } from 'ioredis';

export const hgetAction = {
  name: 'hashes.hget',
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
    const result = await redis.hget(key, field);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Get the value of a field in a hash',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myhash","field":"myfield"}\' http://localhost:3001/api/v1/hashes/hget',
      response: { result: "myvalue" },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get the value of the field "myfield" from the hash "myhash"?',
    },
  ],
};
