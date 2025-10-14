import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';

interface IPublishBody {
    channel: string;
    message: string;
}

export function registerPubSubRoutes(fastify: FastifyInstance, redis: Redis) {
    // Rota para publicar uma mensagem num canal.
    // A parte de 'SUBSCRIBE' (escutar) não é adequada para uma API REST padrão
    // e deve ser implementada com WebSockets ou outra tecnologia de longa duração.
    fastify.post<{ Body: IPublishBody }>('/pubsub/publish', async (request, reply) => {
        try {
            const { channel, message } = request.body;
            if (!channel || !message) {
                return reply.code(400).send({ error: 'Os campos "channel" e "message" são obrigatórios' });
            }
            const receivers = await redis.publish(channel, message);
            reply.send({ status: 'OK', channel, message, receivers });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Erro Interno do Servidor' });
        }
    });
} 
