import { Redis } from 'ioredis';

export const zaddAction = {
  name: 'sortedSets.zadd',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              member: { type: 'string' },
            },
            required: ['score', 'member'],
          },
        },
      },
      required: ['key', 'members'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, members } = request.body;
    const args = members.flatMap((m: any) => [m.score, m.member]);
    const result = await redis.zadd(key, ...args);
    reply.code(201).send({ status: 'OK', membersAdded: result });
  },
  examples: [
    {
      description: 'Add one or more members to a sorted set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myzset","members":[{"score":1,"member":"one"},{"score":2,"member":"two"}]}\' http://localhost:3001/api/v1/sortedSets/zadd',
      response: { status: 'OK', membersAdded: 2 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I add the members "one" (with score 1) and "two" (with score 2) to the sorted set "myzset"?',
    },
  ],
};
