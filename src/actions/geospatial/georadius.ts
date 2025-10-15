import { Redis } from 'ioredis';

export const georadiusAction = {
  name: 'geospatial.georadius',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        lon: { type: 'number' },
        lat: { type: 'number' },
        radius: { type: 'number' },
        unit: { type: 'string', enum: ['m', 'km', 'ft', 'mi'] },
        withdist: { type: 'boolean' },
        withcoord: { type: 'boolean' },
        count: { type: 'number' },
      },
      required: ['key', 'lon', 'lat', 'radius', 'unit'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, lon, lat, radius, unit, withdist, withcoord, count } = request.body;
    const baseArgs: [number, number, number, 'm' | 'km' | 'ft' | 'mi'] = [lon, lat, radius, unit];
    const extraArgs: (string | number)[] = [];

    if (withdist) extraArgs.push('WITHDIST');
    if (withcoord) extraArgs.push('WITHCOORD');
    if (count) extraArgs.push('COUNT', count);

    const results = await redis.georadius(key, ...baseArgs, ...extraArgs);
    reply.send({ results });
  },
  examples: [
    {
      description: 'Find members within a certain radius',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"cities","lon":-46.6,"lat":-23.5,"radius":100,"unit":"km"}\' http://localhost:3001/api/v1/geospatial/georadius',
      response: { results: ["Sao Paulo"] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I find all cities within a 100km radius of longitude -46.6 and latitude -23.5?',
    },
  ],
};
