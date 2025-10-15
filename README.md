🚀 ioredis-fastify

Uma API REST modular construída com Fastify e ioredis, oferecendo acesso HTTP completo às estruturas de dados e comandos do Redis — incluindo operações de keys, hashes, lists, sets, sorted sets, streams, pub/sub, bitmaps, geospatial, pipelines, hyperloglogs e transações.


---

🧠 Visão Geral

Este projeto tem como objetivo fornecer uma camada HTTP simples, extensível e performática sobre o Redis, ideal para:

Debug ou inspeção rápida de dados Redis via API REST;

Testes e automações sem precisar instalar o redis-cli;

Aprendizado e prototipagem de integrações complexas com Redis.


Cada tipo de dado Redis é exposto em um módulo separado dentro de src/routes, o que torna o código organizado e fácil de expandir.


---

⚙️ Instalação

git clone https://github.com/suissa/ioredis-fastify.git
cd ioredis-fastify
pnpm install

Crie um arquivo .env com as variáveis:

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
API_PREFIX=/api/v1

Inicie o servidor:

pnpm dev
# ou
pnpm start

A API estará disponível em:

http://localhost:3000/api/v1


---

🔌 Estrutura do Projeto

src/
├── server.ts         # ponto de entrada do Fastify
├── routes/
│   ├── bitmaps.ts
│   ├── geospatial.ts
│   ├── hashes.ts
│   ├── hyperloglogs.ts
│   ├── keys.ts
│   ├── lists.ts
│   ├── pipelining.ts
│   ├── pubsub.ts
│   ├── sets.ts
│   ├── sortedSets.ts
│   ├── streams.ts
│   └── transactions.ts


---

📡 Endpoints (prefixo /api/v1)

Cada módulo expõe operações equivalentes aos comandos Redis correspondentes.
Abaixo, um resumo por tipo:


---

🔑 Keys (keys.ts)

Método	Rota	Descrição

GET	/api/v1/keys/:key	Obter valor de uma chave
POST	/api/v1/keys/:key	Definir valor (aceita TTL opcional ex)
DELETE	/api/v1/keys/:key	Remover chave
GET	/api/v1/keys	Buscar por padrão (?pattern=*user*)
GET	/api/v1/keys/:key/type	Tipo da chave
POST	/api/v1/keys/:key/rename	Renomear
POST	/api/v1/keys/exists	Verificar existência de múltiplas chaves



---

🧱 Hashes (hashes.ts)

Método	Rota	Descrição

GET	/api/v1/hashes/:key	Retorna todos os campos (HGETALL)
POST	/api/v1/hashes/:key	Define campos (HMSET)



---

📜 Lists (lists.ts)

Método	Rota	Descrição

GET	/api/v1/lists/:key	Retorna intervalo (LRANGE)
POST	/api/v1/lists/:key	Insere valores (LPUSH/RPUSH)



---

🧩 Sets (sets.ts)

Método	Rota	Descrição

GET	/api/v1/sets/:key	Retorna membros (SMEMBERS)
POST	/api/v1/sets/:key	Adiciona valores (SADD)
DELETE	/api/v1/sets/:key	Remove valores (SREM)



---

🔢 Sorted Sets (sortedSets.ts)

Método	Rota	Descrição

GET	/api/v1/sortedSets/:key	Retorna elementos (ZRANGE)
POST	/api/v1/sortedSets/:key	Adiciona elemento com score (ZADD)
DELETE	/api/v1/sortedSets/:key/:member	Remove membro (ZREM)



---

📈 HyperLogLogs (hyperloglogs.ts)

Método	Rota	Descrição

POST	/api/v1/hyperloglogs/:key	Adiciona elementos (PFADD)
GET	/api/v1/hyperloglogs/:key	Retorna contagem (PFCOUNT)
POST	/api/v1/hyperloglogs/merge/:dest	Mescla logs (PFMERGE)



---

🧮 Bitmaps (bitmaps.ts)

Método	Rota	Descrição

POST	/api/v1/bitmaps/:key	Define bit (SETBIT)
GET	/api/v1/bitmaps/:key/:offset	Lê bit (GETBIT)
GET	/api/v1/bitmaps/:key/count	Conta bits 1 (BITCOUNT)



---

🌍 Geospatial (geospatial.ts)

Método	Rota	Descrição

POST	/api/v1/geospatial/:key	Adiciona coordenadas (GEOADD)
GET	/api/v1/geospatial/:key/pos	Retorna coordenadas (GEOPOS)
GET	/api/v1/geospatial/:key/dist	Distância (GEODIST)
GET	/api/v1/geospatial/:key/radius	Busca por raio (GEORADIUS)



---

🔁 Pipelining (pipelining.ts)

Método	Rota	Descrição

POST	/api/v1/pipelining	Executa múltiplos comandos em batch (pipeline.exec())



---

💬 Pub/Sub (pubsub.ts)

Método	Rota	Descrição

POST	/api/v1/pubsub/publish	Publica mensagem (PUBLISH)



---

⚙️ Transactions (transactions.ts)

Método	Rota	Descrição

POST	/api/v1/transactions	Executa comandos atômicos (MULTI / EXEC)



---

🌊 Streams (streams.ts)

Método	Rota	Descrição

POST	/api/v1/streams/:key	Adiciona entrada (XADD)
GET	/api/v1/streams/:key	Lê mensagens (XRANGE / XREAD)
DELETE	/api/v1/streams/:key/:id	Remove entrada (XDEL)



---

🧰 Tecnologias

Fastify – framework HTTP de alta performance

ioredis – cliente Redis robusto com suporte a cluster

TypeScript – tipagem segura e escalável

dotenv – configuração de ambiente



---

🧪 Testando com cURL

# Teste o servidor
curl http://localhost:3000/api/v1/ping

# Crie uma chave
curl -X POST http://localhost:3000/api/v1/keys/user:1 -H "Content-Type: application/json" -d '{"value": {"name": "Suissa"}, "ex": 60}'


---

🤝 Contribuindo

Pull requests são bem-vindos!
Siga o estilo existente, mantendo módulos separados em src/routes/ por tipo de dado Redis.


---

📄 Licença

MIT © Suissa
 
