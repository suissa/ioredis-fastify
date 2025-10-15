import { Redis } from 'ioredis';

export const xaddAction = {
  name: 'streams.xadd',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        data: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['key', 'data'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, data } = request.body;
    const args = Object.entries(data).flat() as string[];
    const messageId = await redis.xadd(key, '*', ...args);
    reply.code(201).send({ status: 'OK', messageId });
  },
  examples: [
    {
      description: 'Add an entry to a stream',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mystream","data":{"field1":"value1","field2":"value2"}}\' http://localhost:3001/api/v1/streams/xadd',
      response: { status: 'OK', messageId: '1672531200000-0' },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I add an entry with field1 "value1" and field2 "value2" to the stream "mystream"?',
    },
  ],
};
