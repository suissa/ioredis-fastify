import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

// Interfaces de tipos para este módulo
interface IKeyParams { key: string; }
interface IPostKeyBody { value: unknown; ex?: number; }
interface IKeysQuery { pattern?: string; }
interface IExpireBody { seconds: number; }
interface IRenameBody { newKey: string; }
interface IExistsBody { keys: string[]; }


export function registerKeyRoutes(fastify: FastifyInstance, redis: Redis) {
    // ... (rotas existentes: GET /keys/:key, POST /keys/:key, DELETE /keys/:key, GET /keys, INCR, EXPIRE, TTL) ...

    // GET /keys/:key/type - Obtém o tipo de dado de uma chave
    fastify.get<{ Params: IKeyParams }>('/keys/:key/type', async (request, reply) => {
        try {
            const { key } = request.params;
            const type = await redis.type(key);
            reply.send({ key, type });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    // POST /keys/:key/rename - Renomeia uma chave
    fastify.post<{ Params: IKeyParams; Body: IRenameBody }>('/keys/:key/rename', async (request, reply) => {
        try {
            const { key } = request.params;
            const { newKey } = request.body;
            if (!newKey) {
                return reply.code(400).send({ error: 'O campo "newKey" é obrigatório' });
            }
            const exists = await redis.exists(key);
            if (!exists) {
                return reply.code(404).send({ error: 'Chave de origem não encontrada' });
            }
            await redis.rename(key, newKey);
            reply.send({ status: 'OK', message: `Chave '${key}' renomeada para '${newKey}'` });
        } catch (err: any) {
            fastify.log.error(err);
            if (err.message.includes('no such key')) {
                return reply.code(404).send({ error: 'Chave de origem não encontrada' });
            }
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });

    // POST /keys/exists - Verifica se uma ou mais chaves existem
    fastify.post<{ Body: IExistsBody }>('/keys/exists', async (request, reply) => {
        try {
            const { keys } = request.body;
            if (!Array.isArray(keys) || keys.length === 0) {
                return reply.code(400).send({ error: 'O corpo deve conter um array "keys"' });
            }
            const count = await redis.exists(...keys);
            reply.send({ existing_keys_count: count });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
    } 
