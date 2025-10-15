import Fastify, { FastifyInstance } from 'fastify';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// --- Importa os módulos de rotas ---
import { registerKeyRoutes } from './routes/keys';
import { registerHashRoutes } from './routes/hashes';
import { registerListRoutes } from './routes/lists';
import { registerSetRoutes } from './routes/sets';
import { registerSortedSetRoutes } from './routes/sortedSets';
import { registerStreamRoutes } from './routes/streams';
import { registerGeospatialRoutes } from './routes/geospatial';
import { registerBitmapRoutes } from './routes/bitmaps';
import { registerHyperLogLogRoutes } from './routes/hyperloglogs';
import { registerPubSubRoutes } from './routes/pubsub';
import { registerTransactionRoutes } from './routes/transaction';
import { registerPipelineRoutes } from './routes/pipeline';

// --- Carrega variáveis de ambiente ---
dotenv.config();

const fastify: FastifyInstance = Fastify({ logger: true });

// --- Valida variáveis obrigatórias ---
if (!process.env.REDIS_URL) {
  fastify.log.error('A variável REDIS_URL não está definida no arquivo .env');
  process.exit(1);
}

// --- Inicializa o cliente Redis ---
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => fastify.log.info('Conectado ao Redis com sucesso.'));
redis.on('error', (err) => fastify.log.error('Erro na conexão com o Redis:', err));

// --- Registra as rotas modulares ---
const apiVersion = process.env.API_VERSION || 'v1';

fastify.register(async (apiInstance) => {
  registerKeyRoutes(apiInstance, redis);
  registerHashRoutes(apiInstance, redis);
  registerListRoutes(apiInstance, redis);
  registerSetRoutes(apiInstance, redis);
  registerSortedSetRoutes(apiInstance, redis);
  registerStreamRoutes(apiInstance, redis);
  registerGeospatialRoutes(apiInstance, redis);
  registerBitmapRoutes(apiInstance, redis);
  registerHyperLogLogRoutes(apiInstance, redis);
  registerPubSubRoutes(apiInstance, redis);
  registerTransactionRoutes(apiInstance, redis);
  registerPipelineRoutes(apiInstance, redis);
}, { prefix: `/api/${apiVersion}` });

// --- Inicializa o servidor ---
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Servidor escutando na porta ${port}, com prefixo /api/${apiVersion}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 
