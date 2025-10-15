import { Redis } from 'ioredis';

export const zrangeAction = {
  name: 'sortedSets.zrange',
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
    const members = await redis.zrange(key, start, stop, 'WITHSCORES');
    const result = [];
    for (let i = 0; i < members.length; i += 2) {
      result.push({ member: members[i], score: Number(members[i + 1]) });
    }
    reply.send({ key, members: result });
  },
  examples: [
    {
      description: 'Get a range of members from a sorted set',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"myzset","start":0,"stop":-1}\' http://localhost:3001/api/v1/sortedSets/zrange',
      response: { key: 'myzset', members: [{ member: 'one', score: 1 }, { member: 'two', score: 2 }] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get all the members and their scores from the sorted set "myzset"?',
    },
  ],
};
