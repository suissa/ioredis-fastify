import { Redis } from 'ioredis';

interface ICommand {
  command: string;
  args: (string | number)[];
}

export const execAction = {
  name: 'transactions.exec',
  schema: {
    body: {
      type: 'object',
      properties: {
        commands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              args: {
                type: 'array',
                items: {
                  anyOf: [{ type: 'string' }, { type: 'number' }],
                },
              },
            },
            required: ['command', 'args'],
          },
        },
      },
      required: ['commands'],
    },
  },
  action: (redis: Redis) => async (request: any, reply: any) => {
    const { commands } = request.body;
    const multi = redis.multi();
    for (const cmd of commands) {
      if (typeof (multi as any)[cmd.command] !== 'function') {
        throw new Error(`Comando Redis inválido: ${cmd.command}`);
      }
      (multi as any)[cmd.command](...cmd.args);
    }
    const results = await multi.exec();
    const formattedResults = results?.map(([error, data]) => ({
      error: error ? error.message : null,
      result: data,
    }));
    reply.send({ results: formattedResults });
  },
  examples: [
    {
      description: 'Execute a series of commands in a transaction',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"commands":[{"command":"set","args":["a","1"]},{"command":"get","args":["a"]}]}\' http://localhost:3001/api/v1/transactions/exec',
      response: { results: [{ error: null, result: 'OK' }, { error: null, result: '1' }] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I set the key "a" to "1" and then get its value in a single atomic operation?',
    },
  ],
};
