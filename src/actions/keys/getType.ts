import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams {
  key: string;
}

export const getTypeAction = {
  name: 'keys.getType',
  schema: {
    params: {
      type: 'object',
      properties: {
        key: { type: 'string' },
      },
      required: ['key'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    try {
      const { key } = request.params as IKeyParams;
      const type = await redis.type(key);
      reply.send({ key, type });
    } catch (err) {
      request.log.error(err);
      reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
  },
  examples: [
    {
      description: 'Get the type of the key "mykey"',
      command: 'curl http://localhost:3000/api/v1/keys/mykey/type',
      response: { key: 'mykey', type: 'string' },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I find out the type of the key "mykey"?',
    },
  ],
};
