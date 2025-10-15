import { Redis } from 'ioredis';

export const zremAction = {
  name: 'sortedSets.zrem',
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
    const result = await redis.zrem(key, ...members);
    reply.send({ status: 'OK', membersRemoved: result });
  },
  examples: [
    {
      description: 'Remove one or more members from a sorted set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myzset","members":["one"]}\' http://localhost:3001/api/v1/sortedSets/zrem',
      response: { status: 'OK', membersRemoved: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I remove the member "one" from the sorted set "myzset"?',
    },
  ],
};
