import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IHashPostBody { [key: string]: string; }

export function registerHashRoutes(fastify: FastifyInstance, redis: Redis) {
    fastify.get<{ Params: IKeyParams }>('/hashes/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const hash = await redis.hgetall(key);
            if (Object.keys(hash).length === 0) {
                return reply.code(404).send({ error: 'Chave de hash não encontrada' });
            }
            reply.send(hash);
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    fastify.post<{ Params: IKeyParams; Body: IHashPostBody }>('/hashes/:key', async (request, reply) => {
        try {
            const { key } = request.params;
            const fields = request.body;
            if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
                return reply.code(400).send({ error: 'O corpo da requisição deve ser um objeto não vazio' });
            }
            const result = await redis.hset(key, fields);
            reply.code(201).send({ status: 'OK', fieldsAdded: result });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
