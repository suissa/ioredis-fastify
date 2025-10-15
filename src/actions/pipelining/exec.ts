import { Redis } from 'ioredis';

interface ICommand {
  command: string;
  args: (string | number)[];
}

export const execAction = {
  name: 'pipelining.exec',
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
    const pipeline = redis.pipeline();
    for (const cmd of commands) {
      if (typeof (pipeline as any)[cmd.command] !== 'function') {
        throw new Error(`Comando Redis inválido: ${cmd.command}`);
      }
      (pipeline as any)[cmd.command](...cmd.args);
    }
    const results = await pipeline.exec();
    const formattedResults = results?.map(([error, data]) => ({
      error: error ? error.message : null,
      result: data,
    }));
    reply.send({ results: formattedResults });
  },
  examples: [
    {
      description: 'Execute a series of commands in a pipeline',
      command: 'curl -X POST -H "Content-Type: application/json" -d \'{"commands":[{"command":"ping"},{"command":"echo","args":["hello"]}]}\' http://localhost:3001/api/v1/pipelining/exec',
      response: { results: [{ error: null, result: 'PONG' }, { error: null, result: 'hello' }] },
    },
  ],
  prompts: [
    {
      role: 'system',
      content: 'You are a helpful assistant for a Redis-like API.',
    },
    {
      role: 'user',
      content: 'How can I send a PING command and then an ECHO command with the argument "hello" in a single network request?',
    },
  ],
};
