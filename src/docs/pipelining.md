# Pipelining

Este documento detalha o uso dos endpoints para execução de **comandos em lote** no Redis, usando a técnica de **Pipelining**.

---

## 1. O Conceito: Pipelining

**Pipelining** é uma técnica de **otimização de rede** que permite enviar **vários comandos de uma só vez** para o servidor Redis, sem precisar aguardar a resposta de cada comando antes de enviar o próximo.

O servidor processa todos os comandos recebidos e retorna todas as respostas em sequência, reduzindo drasticamente o impacto da **latência de rede (RTT — Round Trip Time)**.

### Características Principais

- **Otimização de Rede:**  
  Reduz o tempo total de execução ao eliminar esperas entre comandos consecutivos.

- **Alta Performance:**  
  Ideal para cenários com **muitos comandos independentes** — leitura ou escrita em massa.

- **Não Atômico:**  
  Diferente de uma transação (`MULTI/EXEC`), o pipeline **não é executado como operação única e isolada**.  
  Outros clientes podem modificar dados no meio da execução.

---

### Analogia com o Mundo Real

Imagine que você está num supermercado com uma lista de 10 itens.

- **Sem Pipelining:**  
  Você pede o primeiro item, espera o funcionário trazer, depois o segundo, e assim por diante.  
  Lento e ineficiente.

- **Com Pipelining:**  
  Você entrega a **lista completa** de uma vez.  
  O funcionário busca tudo e traz de volta num único retorno.  
  Muito mais rápido — mas enquanto isso, outro cliente pode pegar o último iogurte da prateleira.

---

## 2. Estrutura do Endpoint

O endpoint `/pipeline` tem a mesma estrutura do `/transaction`, aceitando uma **lista de comandos Redis**.

Use-o quando:
- Precisa de **máximo desempenho** em lotes de operações;
- **A atomicidade não é uma preocupação**.

---

## 3. Exemplo de Uso com a API

### Caso de Uso 1: Obter Múltiplos Dados para Renderizar uma Página

**Cenário:**  
Para renderizar a página de perfil de um usuário, precisamos buscar:
1. Dados do perfil (Hash);
2. Últimas 5 atividades (Lista);
3. Número de amigos (Set).

#### Requisição API

```bash
curl -X POST http://localhost:3000/api/v1/pipeline -H "Content-Type: application/json" -d '{
  "commands": [
    ["HGETALL", "user:123:profile"],
    ["LRANGE", "user:123:activities", "0", "4"],
    ["SCARD", "user:123:friends"]
  ]
}'
```

**Equivalente Redis:**

```redis
HGETALL user:123:profile
LRANGE user:123:activities 0 4
SCARD user:123:friends
```

**Resposta esperada:**
```json
{
  "results": [
    { "name": "João", "age": "27", "email": "joao@example.com" },
    [
      "fez login",
      "publicou um post",
      "curtiu uma foto",
      "comentou uma publicação",
      "atualizou o perfil"
    ],
    58
  ]
}
```

---

### Caso de Uso 2: Escrita em Massa (Batch Insert)

**Cenário:**  
Você precisa inicializar 100 chaves com valores padrão rapidamente.

#### Exemplo Node.js com ioredis

```js
import Redis from "ioredis";
const redis = new Redis();

const pipeline = redis.pipeline();

for (let i = 1; i <= 100; i++) {
  pipeline.set(`config:${i}`, "default");
}

const results = await pipeline.exec();
console.log("Pipeline concluído:", results.length, "comandos executados");
```

**Equivalente Redis (conceitualmente):**
```redis
SET config:1 default
SET config:2 default
...
SET config:100 default
```

**Vantagem:**  
Em vez de 100 viagens de rede, apenas **uma**.

---

### Caso de Uso 3: Atualizações em Série de Estatísticas

**Cenário:**  
Em um jogo multiplayer, você precisa atualizar várias métricas do jogador após uma partida.

#### Exemplo via API

```bash
curl -X POST http://localhost:3000/api/v1/pipeline -H "Content-Type: application/json" -d '{
  "commands": [
    ["HINCRBY", "player:42:stats", "kills", "3"],
    ["HINCRBY", "player:42:stats", "deaths", "1"],
    ["HINCRBY", "player:42:stats", "assists", "2"],
    ["ZINCRBY", "leaderboard:rank", "100", "player:42"]
  ]
}'
```

**Equivalente Redis:**

```redis
HINCRBY player:42:stats kills 3
HINCRBY player:42:stats deaths 1
HINCRBY player:42:stats assists 2
ZINCRBY leaderboard:rank 100 player:42
```

---

### Caso de Uso 4: Consulta de Métricas em Massa

**Cenário:**  
Um dashboard precisa obter métricas de vários serviços em tempo real.

```bash
curl -X POST http://localhost:3000/api/v1/pipeline -H "Content-Type: application/json" -d '{
  "commands": [
    ["GET", "service:api:latency"],
    ["GET", "service:db:connections"],
    ["GET", "service:cache:hits"],
    ["GET", "service:queue:pending"]
  ]
}'
```

**Equivalente Redis:**
```redis
GET service:api:latency
GET service:db:connections
GET service:cache:hits
GET service:queue:pending
```

**Resposta:**
```json
{
  "results": [ "123ms", "42", "9823", "14" ]
}
```

---

## 4. Diferença entre Pipelining e Transações

| Aspecto | Pipelining | Transação (`MULTI/EXEC`) |
|----------|-------------|----------------------------|
| **Execução** | Envia múltiplos comandos de uma só vez | Agrupa comandos e executa todos atômicamente |
| **Atomicidade** | ❌ Não atômico | ✅ Atômico |
| **Velocidade** | ⚡ Máxima (reduz RTT) | Rápida, mas com overhead de isolamento |
| **Interferência Externa** | Sim, outros clientes podem alterar dados | Não durante o bloco |
| **Uso ideal** | Operações independentes e massivas | Operações interdependentes e críticas |

---

## 5. Boas Práticas

✅ **Agrupe comandos independentes** — ideal para leituras ou inicializações em massa.  
✅ **Evite pipelines muito grandes** (> 10.000 comandos) — podem causar estouro de memória no cliente.  
✅ **Combine com transações** quando precisar de atomicidade parcial.  
✅ **Monitore o tempo de resposta total** — alguns servidores Redis têm limite de buffer de pipeline.  
✅ **Use pipelines em workers ou scripts** para reduzir o tempo de execução em loops.  

---

## 6. Exemplo Avançado: Node.js (Pipelining + Promises)

```js
import Redis from "ioredis";
const redis = new Redis();

const pipeline = redis.pipeline();

const keys = ["a", "b", "c", "d"];
keys.forEach(k => pipeline.incr(k));

const results = await pipeline.exec();

results.forEach(([err, res], i) => {
  if (err) console.error(`Erro em ${keys[i]}:`, err);
  else console.log(`${keys[i]} atualizado para`, res);
});
```

**Saída:**
```
a atualizado para 1
b atualizado para 3
c atualizado para 7
d atualizado para 2
```

---

## 7. Conclusão

O **Pipelining** é uma técnica fundamental de otimização para o Redis.  
Ele **reduz a latência** e **aumenta a vazão** de comandos, especialmente em cenários de alto volume de operações curtas.

Use Pipelining quando:
- Deseja **enviar muitos comandos independentes rapidamente**;
- A atomicidade não é crítica;
- Quer extrair **máximo desempenho** da comunicação cliente-servidor.

Para lógica transacional, prefira `MULTI/EXEC`.  
Para alto throughput, **Pipelining é o caminho.**
