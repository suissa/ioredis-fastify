import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface ISetBody { members: string[]; }

export function registerSetRoutes(fastify: FastifyInstance, redis: Redis) {
    fastify.post<{ Params: IKeyParams; Body: ISetBody }>('/sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { members } = request.body;
            if (!Array.isArray(members) || members.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "members" não vazio' });
            }
            const result = await redis.sadd(key, ...members);
            reply.code(201).send({ status: 'OK', membersAdded: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    fastify.get<{ Params: IKeyParams }>('/sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const members = await redis.smembers(key);
            reply.send({ key, members });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    fastify.delete<{ Params: IKeyParams; Body: ISetBody }>('/sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { members } = request.body;
            if (!Array.isArray(members) || members.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "members" não vazio' });
            }
            const result = await redis.srem(key, ...members);
            reply.send({ status: 'OK', membersRemoved: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
