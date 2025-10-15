import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IExistsBody {
  keys: string[];
}

export const existsAction = {
  name: 'keys.exists',
  schema: {
    body: {
      type: 'object',
      properties: {
        keys: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['keys'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    try {
      const { keys } = request.body as IExistsBody;
      if (!Array.isArray(keys) || keys.length === 0) {
        return reply.code(400).send({ error: 'O corpo deve conter um array "keys"' });
      }
      const count = await redis.exists(...keys);
      reply.send({ existing_keys_count: count });
    } catch (err) {
      request.log.error(err);
      reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
  },
  examples: [
    {
      description: 'Check if the keys "mykey" and "anotherkey" exist',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"keys":["mykey","anotherkey"]}\' http://localhost:3000/api/v1/keys/exists',
      response: { existing_keys_count: 1 },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I check if the keys "mykey" and "anotherkey" exist?',
    },
  ],
};
