import { Redis } from 'ioredis';

export const xrangeAction = {
  name: 'streams.xrange',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        start: { type: 'string' },
        end: { type: 'string' },
        count: { type: 'number' },
      },
      required: ['key', 'start', 'end'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, start, end, count } = request.body;
    let entries;
    if (count) {
      entries = await redis.xrange(key, start, end, 'COUNT', count);
    } else {
      entries = await redis.xrange(key, start, end);
    }
    const formattedEntries = entries.map(([id, data]) => {
      const dataObj: { [key: string]: string } = {};
      for (let i = 0; i < data.length; i += 2) {
        dataObj[data[i]] = data[i + 1];
      }
      return { id, data: dataObj };
    });
    reply.send({ key, entries: formattedEntries });
  },
  examples: [
    {
      description: 'Get a range of entries from a stream',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mystream","start":"-","end":"+"}\' http://localhost:3001/api/v1/streams/xrange',
      response: { key: 'mystream', entries: [{ id: '1672531200000-0', data: { field1: 'value1', field2: 'value2' } }] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I get all the entries from the stream "mystream"?',
    },
  ],
};
