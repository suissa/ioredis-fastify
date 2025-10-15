import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import readline from 'readline';

// Carrega variáveis de ambiente
dotenv.config();

// Valida variáveis obrigatórias
if (!process.env.REDIS_URL) {
  console.error('A variável REDIS_URL não está definida no arquivo .env');
  process.exit(1);
}

// Inicializa o cliente Redis
const redis = new Redis(process.env.REDIS_URL);
const actions = new Map<string, any>();

// --- Carregamento dinâmico de ações ---
async function loadActions() {
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

// --- Interface Stdio ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'mcp> '
});

rl.on('line', async (line) => {
  const [actionName, ...args] = line.trim().split(' ');

  if (!actionName) {
    rl.prompt();
    return;
  }

  if (actionName === 'exit') {
    rl.close();
    return;
  }

  if (!actions.has(actionName)) {
    console.log(`Ação '${actionName}' não encontrada.`);
    rl.prompt();
    return;
  }

  try {
    const actionObject = actions.get(actionName);
    const handler = actionObject.action(redis);

    // Simula request e reply para a ação
    let payload = {};
    try {
        if(args.length > 0) payload = JSON.parse(args.join(' '));
    } catch(e) {
        console.log("Argumentos JSON inválidos.");
        rl.prompt();
        return;
    }

    const request = {
        body: payload,
        params: payload, // Para simplicidade, assumimos que os argumentos podem ser params ou body
        query: payload,
    };

    const reply = {
      code: (statusCode: number) => ({
        send: (data: any) => console.log(JSON.stringify(data, null, 2))
      }),
      send: (data: any) => console.log(JSON.stringify(data, null, 2))
    };

    await handler(request, reply as any);

  } catch (e: any) {
    console.error(`Erro ao executar a ação: ${e.message}`);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('Saindo do cliente MCP.');
  redis.quit();
  process.exit(0);
});


async function main() {
  await loadActions();
  console.log('Cliente MCP Stdio. Digite "exit" para sair.');
  console.log('Uso: <actionName> [jsonPayload]');
  console.log('Exemplo: keys.getType {"key":"mykey"}');
  rl.prompt();
}

main();
