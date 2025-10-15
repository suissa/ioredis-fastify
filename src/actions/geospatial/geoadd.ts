import { Redis } from 'ioredis';

export const geoaddAction = {
  name: 'geospatial.geoadd',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              longitude: { type: 'number' },
              latitude: { type: 'number' },
              member: { type: 'string' },
            },
            required: ['longitude', 'latitude', 'member'],
          },
        },
      },
      required: ['key', 'locations'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { key, locations } = request.body;
    const args = locations.flatMap((l: any) => [l.longitude, l.latitude, l.member]);
    const result = await redis.geoadd(key, ...args);
    reply.code(201).send({ status: 'OK', locationsAdded: result });
  },
  examples: [
    {
      description: 'Add a geospatial location',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"cities","locations":[{"longitude":-46.633309,"latitude":-23.550520,"member":"Sao Paulo"}]}\' http://localhost:3001/api/v1/geospatial/geoadd',
      response: { status: 'OK', locationsAdded: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I add the location of Sao Paulo to the "cities" key?',
    },
  ],
};
