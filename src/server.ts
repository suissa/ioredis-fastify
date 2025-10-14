/**
 * Ponto de entrada principal para a API Fastify que interage com o Redis.
 *
 * Para executar:
 * 1. Instale as dependências: npm install
 * 2. Crie um ficheiro .env (use .env.example como modelo)
 * 3. Inicie o servidor em modo de desenvolvimento: npm run dev
 */
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// Carrega as variáveis de ambiente do ficheiro .env
dotenv.config();

// --- Definições de Tipos para as Rotas ---

interface IKeyParams {
    key: string;
}

interface IPostKeyBody {
    value: unknown;
    ex?: number;
}

interface IKeysQuery {
    pattern?: string;
}

interface IHashPostBody {
    [key: string]: string;
}

interface IListGetQuery {
    start?: number;
    stop?: number;
}

interface IListPostBody {
    values: unknown[];
    direction?: 'left' | 'right';
}


// Inicializa o servidor Fastify com logger ativado.
const fastify: FastifyInstance = Fastify({ logger: true });

// Valida se a URL do Redis foi definida nas variáveis de ambiente.
if (!process.env.REDIS_URL) {
    fastify.log.error('A variável REDIS_URL não está definida no seu ficheiro .env');
    process.exit(1);
}

// Cria uma nova instância do cliente Redis.
const redis = new Redis(process.env.REDIS_URL);

// Adiciona listeners para os eventos de conexão do Redis para logging.
redis.on('connect', () => {
    fastify.log.info('Conectado ao Redis com sucesso.');
});

redis.on('error', (err) => {
    fastify.log.error('Erro na conexão com o Redis:', err);
});

// --- Rotas da API ---

// --- Operações Gerais de Chave-Valor (Strings) ---

/**
 * Rota para obter o valor de uma chave.
 * Retorna 404 se a chave não for encontrada.
 */
fastify.get<{ Params: IKeyParams }>('/keys/:key', async (request, reply) => {
    try {
        const { key } = request.params;
        const value = await redis.get(key);

        if (value === null) {
            return reply.code(404).send({ error: 'Chave não encontrada' });
        }
        // Tenta fazer o parse do valor caso seja um JSON, senão retorna como string.
        try {
            reply.send({ key, value: JSON.parse(value) });
        } catch (e) {
            reply.send({ key, value });
        }
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
});

/**
 * Rota para definir o valor de uma chave.
 * Opcionalmente, pode-se definir um tempo de expiração (`ex` em segundos) no corpo da requisição.
 */
fastify.post<{ Params: IKeyParams; Body: IPostKeyBody }>('/keys/:key', async (request, reply) => {
    try {
        const { key } = request.params;
        const { value, ex } = request.body;

        if (typeof value === 'undefined') {
            return reply.code(400).send({ error: 'O campo "value" é obrigatório no corpo da requisição' });
        }

        // Serializa o valor para JSON para armazenar objetos complexos.
        const valueToStore = JSON.stringify(value);

        if (ex && typeof ex === 'number') {
            await redis.set(key, valueToStore, 'EX', ex);
        } else {
            await redis.set(key, valueToStore);
        }

        reply.code(201).send({ status: 'OK' });
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
});

/**
 * Rota para apagar uma ou mais chaves.
 */
fastify.delete<{ Params: IKeyParams }>('/keys/:key', async (request, reply) => {
    try {
        const { key } = request.params;
        const result = await redis.del(key);

        if (result === 0) {
            return reply.code(404).send({ error: 'Chave não encontrada' });
        }
        reply.send({ status: 'OK', deletedCount: result });
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
});

/**
 * Rota para procurar chaves que correspondem a um padrão.
 * O padrão pode ser passado via query string (ex: /keys?pattern=user:*)
 */
fastify.get<{ Querystring: IKeysQuery }>('/keys', async (request, reply) => {
    try {
        const pattern = request.query.pattern || '*';
        const keys = await redis.keys(pattern);
        reply.send({ keys });
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
});


// --- Operações com Hashes ---

/**
 * Rota para obter todos os campos e valores de um hash.
 */
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

/**
 * Rota para definir um ou mais campos em um hash.
 * Espera um objeto JSON no corpo da requisição.
 */
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


// --- Operações com Listas ---

/**
 * Rota para obter um intervalo de elementos de uma lista.
 * `start` e `stop` podem ser passados via query string.
 */
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

/**
 * Rota para adicionar elementos a uma lista (lpush ou rpush).
 * O corpo da requisição deve conter um array `values` e, opcionalmente, `direction` ('left' ou 'right').
 */
fastify.post<{ Params: IKeyParams; Body: IListPostBody }>('/lists/:key', async (request, reply) => {
    try {
        const { key } = request.params;
        const { values, direction = 'right' } = request.body;

        if (!Array.isArray(values) || values.length === 0) {
            return reply.code(400).send({ error: 'O corpo da requisição deve conter um array "values" não vazio' });
        }

        const stringValues = values.map(v => JSON.stringify(v));

        let result;
        if (direction === 'left') {
            result = await redis.lpush(key, ...stringValues);
        } else {
            result = await redis.rpush(key, ...stringValues);
        }
        reply.code(201).send({ status: 'OK', listLength: result });
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Erro Interno do Servidor' });
    }
});


// --- Inicialização do Servidor ---

/**
 * Função para iniciar o servidor Fastify.
 */
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Servidor a escutar na porta ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

 
