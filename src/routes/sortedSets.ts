import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IGetQuery { start?: number; stop?: number; }
interface ISortedSetBody { members: { score: number; member: string }[]; }
interface IDeleteBody { members: string[]; }


export function registerSortedSetRoutes(fastify: FastifyInstance, redis: Redis) {
    fastify.post<{ Params: IKeyParams; Body: ISortedSetBody }>('/sorted-sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { members } = request.body;
            if (!Array.isArray(members) || members.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "members"' });
            }
            const args = members.flatMap(m => [m.score, m.member]);
            const result = await redis.zadd(key, ...args);
            reply.code(201).send({ status: 'OK', membersAdded: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    fastify.get<{ Params: IKeyParams, Querystring: IGetQuery }>('/sorted-sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const start = request.query.start || 0;
            const stop = request.query.stop || -1;
            const members = await redis.zrange(key, start, stop, 'WITHSCORES');
            const result = [];
            for (let i = 0; i < members.length; i += 2) {
                result.push({ member: members[i], score: Number(members[i + 1]) });
            }
            reply.send({ key, members: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
    
    fastify.delete<{ Params: IKeyParams; Body: IDeleteBody }>('/sorted-sets/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const { members } = request.body;
             if (!Array.isArray(members) || members.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "members"' });
            }
            const result = await redis.zrem(key, ...members);
            reply.send({ status: 'OK', membersRemoved: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
