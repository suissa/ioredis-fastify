import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IPFAddBody { elements: string[]; }
interface IPFCountQuery { keys: string; }

export function registerHyperLogLogRoutes(fastify: FastifyInstance, redis: Redis) {
    // Adiciona elementos a um HyperLogLog
    fastify.post<{ Params: IKeyParams; Body: IPFAddBody }>('/hyperloglogs/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { elements } = request.body;
            if (!Array.isArray(elements) || elements.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "elements"' });
            }
            const result = await redis.pfadd(key, ...elements);
            reply.code(201).send({ status: 'OK', updated: result === 1 });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    // Conta a cardinalidade aproximada de uma ou mais chaves
    fastify.get<{ Querystring: IPFCountQuery }>('/hyperloglogs/count', async (request, reply) => {
        try {
            const { keys } = request.query;
            if (!keys) {
                return reply.code(400).send({ error: 'A query string "keys" é obrigatória' });
            }
            const keyArray = keys.split(',');
            const count = await redis.pfcount(...keyArray);
            reply.send({ keys: keyArray, approximate_cardinality: count });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
