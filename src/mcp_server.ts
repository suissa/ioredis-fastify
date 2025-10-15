import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import websocketPlugin from '@fastify/websocket';

// Carrega variáveis de ambiente
dotenv.config();

export const fastify: FastifyInstance = Fastify({ logger: true });
const actions = new Map<string, any>();

// Registra o plugin de WebSocket
fastify.register(websocketPlugin);

export async function loadActions() {
  const actionsDir = path.join(__dirname, 'actions');
  const modules = fs.readdirSync(actionsDir);

  for (const module of modules) {
    const moduleDir = path.join(actionsDir, module);
    if (fs.statSync(moduleDir).isDirectory()) {
      const actionFiles = fs.readdirSync(moduleDir).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      for (const file of actionFiles) {
        const actionPath = path.join(moduleDir, file);
        const imported = await import(actionPath);
        const actionObject = imported[Object.keys(imported)[0]];
        if (actionObject && actionObject.name) {
          actions.set(actionObject.name, actionObject);
        }
      }
    }
  }
}

export function registerRoutes(redis: Redis) {
  const apiVersion = process.env.API_VERSION || 'v1';
  fastify.register(
    async (apiInstance: FastifyInstance) => {
      for (const [actionName, actionObject] of actions.entries()) {
        const [module, action] = actionName.split('.');
        if (!module || !action) {
          continue;
        }

        const hasBody = actionObject.schema && actionObject.schema.body;
        const url = `/${module}/${action}`;
        const method = hasBody ? 'POST' : 'GET';

        apiInstance.route({
          method,
          url,
          schema: actionObject.schema,
          handler: actionObject.action(redis),
        });
      }
    },
    { prefix: `/api/${apiVersion}` },
  );

  fastify.register(async (instance: FastifyInstance) => {
    instance.get('/ws', { websocket: true }, (connection) => {
      connection.socket.on('message', async message => {
        try {
          const { action: actionName, payload } = JSON.parse(message.toString());
          if (!actions.has(actionName)) {
            return connection.socket.send(JSON.stringify({ error: `Action '${actionName}' not found` }));
          }

          const actionObject = actions.get(actionName);
          const handler = actionObject.action(redis);

          const request = {
            body: payload?.body,
            params: payload?.params,
            query: payload?.query,
            log: instance.log,
          } as FastifyRequest;

          const reply = {
            code: (statusCode: number) => ({
              send: (data: any) => connection.socket.send(JSON.stringify({ status: statusCode, body: data }))
            }),
            send: (data: any) => connection.socket.send(JSON.stringify({ status: 200, body: data }))
          } as unknown as FastifyReply;

          await handler(request, reply);

        } catch (e: any) {
          connection.socket.send(JSON.stringify({ error: 'Invalid message format or action execution failed', details: e.message }));
        }
      });
    });
  });
}

export async function startServer(redis: Redis) {
  try {
    await loadActions();
    registerRoutes(redis);

    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  if (!process.env.REDIS_URL) {
    fastify.log.error('A variável REDIS_URL não está definida no arquivo .env');
    process.exit(1);
  }
  const redis = new Redis(process.env.REDIS_URL);
  startServer(redis);
}
