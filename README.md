# API Fastify com ioredis (TypeScript)

Esta é uma API RESTful robusta construída com Fastify e TypeScript para gerir e interagir com uma base de dados Redis, usando a biblioteca ioredis.
O uso de TypeScript garante segurança de tipos, o que torna o código mais previsível e fácil de manter.

## Pré-requisitos
 * Node.js (v16 ou mais recente)
 * Uma instância do Redis em execução
 * NPM ou Yarn

   
## 1. Instalação
Primeiro, clone o repositório e instale as dependências de produção e desenvolvimento.
# Clone este projeto (ou apenas guarde os ficheiros)
npm install

Este comando irá instalar todas as dependências listadas no package.json, incluindo typescript, ts-node e os tipos necessários.

## 2. Configuração
A API conecta-se ao Redis usando uma URL de conexão. Crie um ficheiro .env na raiz do projeto para armazenar essa informação.
 * Copie o ficheiro de exemplo:
   cp .env.example .env

 * Edite o ficheiro .env e defina a URL de conexão do seu Redis:
   REDIS_URL=redis://usuario:senha@hostname:porta

   Para uma instância local padrão do Redis, sem senha, a configuração será:
   REDIS_URL=redis://localhost:6379

## 3. Executando o Servidor
Modo de Desenvolvimento
Para desenvolvimento, use nodemon e ts-node. O servidor reiniciará automaticamente após qualquer alteração no código.

```
npm run dev
```

### Modo de Produção
Para produção, primeiro compile os ficheiros TypeScript para JavaScript e depois inicie o servidor a partir dos ficheiros compilados.
 * Compilar o código:
```
npm run build
```

Este comando cria uma pasta dist com o código JavaScript resultante.
 * Iniciar o servidor:
```
npm start
```

O servidor será iniciado na porta 3000 por padrão.

## 4. Endpoints da API
Os endpoints são os mesmos da versão JavaScript. Consulte a seção abaixo para exemplos.

Chave-Valor (Strings)
 * GET /keys/:key: Obtém o valor de uma chave.
 * POST /keys/:key: Define o valor para uma chave.
   * Corpo: { "value": { "data": "meu objeto" }, "ex": 60 } (ex opcional)
 * DELETE /keys/:key: Apaga uma chave.
 * GET /keys: Lista chaves que correspondem a um padrão. (?pattern=user:*)

Hashes
 * GET /hashes/:key: Obtém todos os campos de um hash.
 * POST /hashes/:key: Define campos num hash.
   * Corpo: { "nome": "Maria Silva", "idade": "30" }

Listas
 * GET /lists/:key: Obtém elementos de uma lista. (?start=0&stop=10)
 * POST /lists/:key: Adiciona elementos a uma lista.
   * Corpo: { "values": ["item1", "item2"], "direction": "left" } (direction opcional)
 
