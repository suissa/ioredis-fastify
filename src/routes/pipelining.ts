import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface ICommand {
    command: string;
    args: (string | number)[];
}

interface IPipelineBody {
    commands: ICommand[];
}

export function registerPipelineRoutes(fastify: FastifyInstance, redis: Redis) {
    // Executa uma série de comandos via pipeline para otimização de rede.
    // Não garante atomicidade como as transações.
    fastify.post<{ Body: IPipelineBody }>('/pipeline', async (request, reply) => {
        try {
            const { commands } = request.body;
            if (!Array.isArray(commands) || commands.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "commands"' });
            }
            
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

        } catch (err: any) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro ao executar o pipeline', details: err.message });
        }
    });
} 
