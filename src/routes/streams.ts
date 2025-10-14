import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IStreamAddBody { [field: string]: string; }
interface IStreamRangeQuery { start?: string; end?: string; count?: number; }

export function registerStreamRoutes(fastify: FastifyInstance, redis: Redis) {
    // Adiciona uma entrada a uma stream
    fastify.post<{ Params: IKeyParams; Body: IStreamAddBody }>('/streams/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const data = request.body;
            if (typeof data !== 'object' || Object.keys(data).length === 0) {
                return reply.code(400).send({ error: 'O corpo deve ser um objeto com dados' });
            }
            // Converte {a: 'b', c: 'd'} para ['a', 'b', 'c', 'd']
            const args = Object.entries(data).flat();
            const messageId = await redis.xadd(key, '*', ...args);
            reply.code(201).send({ status: 'OK', messageId });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    // Lê um intervalo de entradas de uma stream
    fastify.get<{ Params: IKeyParams; Querystring: IStreamRangeQuery }>('/streams/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { start = '-', end = '+', count } = request.query;

            let entries;
            if (count) {
                entries = await redis.xrange(key, start, end, 'COUNT', count);
            } else {
                entries = await redis.xrange(key, start, end);
            }
            
            // Formata a resposta para ser mais amigável
            const formattedEntries = entries.map(([id, data]) => {
                const dataObj: { [key: string]: string } = {};
                for (let i = 0; i < data.length; i += 2) {
                    dataObj[data[i]] = data[i + 1];
                }
                return { id, data: dataObj };
            });

            reply.send({ key, entries: formattedEntries });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
