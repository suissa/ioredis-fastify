import { Redis } from 'ioredis';

export const hsetAction = {
  name: 'hashes.hset',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        field: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['key', 'field', 'value'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, field, value } = request.body;
    const result = await redis.hset(key, field, value);
    reply.send({ result });
  },
  examples: [
    {
      description: 'Set the value of a field in a hash',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myhash","field":"myfield","value":"myvalue"}\' http://localhost:3001/api/v1/hashes/hset',
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
      content: 'How can I set the value of the field "myfield" to "myvalue" in the hash "myhash"?',
    },
  ],
};
