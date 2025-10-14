import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface ICommand {
    command: string;
    args: (string | number)[];
}

interface ITransactionBody {
    commands: ICommand[];
}

export function registerTransactionRoutes(fastify: FastifyInstance, redis: Redis) {
    // Executa uma série de comandos de forma atómica (MULTI/EXEC).
    fastify.post<{ Body: ITransactionBody }>('/transaction', async (request, reply) => {
        try {
            const { commands } = request.body;
            if (!Array.isArray(commands) || commands.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "commands"' });
            }

            const multi = redis.multi();

            for (const cmd of commands) {
                // Validação básica
                if (typeof (multi as any)[cmd.command] !== 'function') {
                    throw new Error(`Comando Redis inválido: ${cmd.command}`);
                }
                (multi as any)[cmd.command](...cmd.args);
            }

            const results = await multi.exec();

            // O resultado é um array de arrays, onde cada sub-array é [error, result]
            const formattedResults = results?.map(([error, data]) => ({
                error: error ? error.message : null,
                result: data,
            }));

            reply.send({ results: formattedResults });

        } catch (err: any) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro ao executar a transação', details: err.message });
        }
    });
}

 
