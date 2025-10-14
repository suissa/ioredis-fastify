import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IListGetQuery { start?: number; stop?: number; }
interface IListPostBody { values: unknown[]; direction?: 'left' | 'right'; }

export function registerListRoutes(fastify: FastifyInstance, redis: Redis) {
    fastify.get<{ Params: IKeyParams, Querystring: IListGetQuery }>('/lists/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const start = request.query.start || 0;
            const stop = request.query.stop || -1;
            const list = await redis.lrange(key, start, stop);
            reply.send({ key, list });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    fastify.post<{ Params: IKeyParams; Body: IListPostBody }>('/lists/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { values, direction = 'right' } = request.body;
            if (!Array.isArray(values) || values.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "values" não vazio' });
            }
            const stringValues = values.map(v => JSON.stringify(v));
            const command = direction === 'left' ? 'lpush' : 'rpush';
            const result = await redis[command](key, ...stringValues);
            reply.code(201).send({ status: 'OK', listLength: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
