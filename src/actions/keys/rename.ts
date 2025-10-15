import { Redis } from 'ioredis';

export const renameAction = {
  name: 'keys.rename',
  schema: {
    body: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        newKey: { type: 'string' },
      },
      required: ['key', 'newKey'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    try {
      const { key, newKey } = request.body;
      const exists = await redis.exists(key);
      if (!exists) {
        return reply.code(404).send({ error: 'Chave de origem não encontrada' });
      }
      await redis.rename(key, newKey);
      reply.send({ status: 'OK', message: `Chave '${key}' renomeada para '${newKey}'` });
    } catch (err: any) {
      request.log.error(err);
      if (err.message.includes('no such key')) {
        return reply.code(404).send({ error: 'Chave de origem não encontrada' });
      }
      reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
  },
  examples: [
    {
      description: 'Rename the key "mykey" to "newkey"',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"key":"mykey","newKey":"newkey"}\' http://localhost:3001/api/v1/keys/rename',
      response: { status: 'OK', message: "Chave 'mykey' renomeada para 'newkey'" },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I rename the key "mykey" to "newkey"?',
    },
  ],
};
