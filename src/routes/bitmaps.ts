import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IKeyParams { key: string; }
interface IOffsetParams extends IKeyParams { offset: number; }
interface ISetBitBody { value: 0 | 1; }

export function registerBitmapRoutes(fastify: FastifyInstance, redis: Redis) {
    // Define um bit num offset específico
    fastify.post<{ Params: IOffsetParams; Body: ISetBitBody }>('/bitmaps/:key/:offset', async (request, reply) => {
        try {
            const { key, offset } = request.params;
            const { value } = request.body;
            if (value !== 0 && value !== 1) {
                return reply.code(400).send({ error: 'O valor deve ser 0 ou 1' });
            }
            const originalValue = await redis.setbit(key, offset, value);
            reply.send({ status: 'OK', originalValue });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    // Obtém o valor de um bit num offset
    fastify.get<{ Params: IOffsetParams }>('/bitmaps/:key/:offset', async (request, reply) => {
        try {
            const { key, offset } = request.params;
            const value = await redis.getbit(key, offset);
            reply.send({ key, offset, value });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
    
    // Conta os bits definidos como 1
    fastify.get<{ Params: IKeyParams }>('/bitmaps/:key/count', async (request, reply) => {
        try {
            const { key } = request.params;
            const count = await redis.bitcount(key);
            reply.send({ key, count });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
