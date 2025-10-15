# Pub/Sub (Publicar / Subscrever)

Este documento detalha o uso dos endpoints para a funcionalidade de **Publicar/Subscrever (Pub/Sub)** do Redis.

---

## 1. O Conceito: Pub/Sub

O **Pub/Sub** é um **padrão de mensagens assíncrono** onde os remetentes (**publishers**) enviam mensagens para **canais**, sem saber quem as receberá, e os receptores (**subscribers**) ouvem apenas os canais de interesse.

### Características Principais

- **Desacoplamento Total:**  
  Publishers e subscribers não se conhecem.  
  Ambos apenas precisam concordar no nome do canal.

- **Fire-and-Forget:**  
  As mensagens **não são persistidas**.  
  Se ninguém estiver subscrito no momento, a mensagem se perde.

- **Broadcast Instantâneo:**  
  Uma mensagem publicada num canal é entregue **simultaneamente** a todos os subscribers conectados.

- **Tempo Real:**  
  Ideal para notificações instantâneas, sistemas de streaming, e integração entre microserviços.

---

### Analogia com o Mundo Real

Pense numa **estação de rádio**.

- A estação é o **publisher**.  
- A frequência (ex: 99.7 FM) é o **canal**.  
- Os ouvintes são os **subscribers**.

A estação transmite para todos que sintonizaram o canal, sem saber quem são ou quantos estão ouvindo.  
Se você não estiver ouvindo quando uma música toca — perdeu a transmissão. Assim também é o Pub/Sub: **tempo real e efêmero**.

---

## 2. Comandos Fundamentais

| Comando | Descrição |
|----------|------------|
| **PUBLISH channel message** | Publica uma mensagem num canal |
| **SUBSCRIBE channel [channel ...]** | Escuta mensagens de um ou mais canais |
| **PSUBSCRIBE pattern** | Escuta canais com nomes que seguem um padrão (wildcards) |
| **UNSUBSCRIBE [channel ...]** | Cancela a subscrição |
| **PUBSUB CHANNELS** | Lista os canais com subscribers ativos |
| **PUBSUB NUMSUB [channel ...]** | Mostra quantos subscribers estão em cada canal |

---

## 3. Exemplo de Uso com a API REST

> ⚠️ **Importante:**  
> A nossa API REST implementa apenas o **PUBLISH**.  
> A parte de **SUBSCRIBE** é uma conexão contínua (long-lived) e deve ser feita na sua aplicação (ex: usando **ioredis**, **node-redis**, ou **WebSockets**).

---

### Caso de Uso 1: Sistema de Notificações em Tempo Real

**Cenário:**  
Quando um utilizador posta algo novo, queremos notificar outros sistemas ou usuários.

#### Publicar notificação de novo post

```bash
curl -X POST http://localhost:3000/api/v1/pubsub/new_posts -H "Content-Type: application/json" -d '{
  "message": {
    "user": "user:101",
    "action": "new_post",
    "content": "Explorando Redis Pub/Sub!"
  }
}'
```

**Equivalente Redis:**
```redis
PUBLISH new_posts '{"user":"user:101","action":"new_post","content":"Explorando Redis Pub/Sub!"}'
```

---

### Caso de Uso 2: Sistema de Chat

**Cenário:**  
Cada sala de chat é um canal Redis (`chat:room:42`).  
Mensagens são publicadas nesse canal e todos os usuários conectados recebem instantaneamente.

#### Exemplo REST de publicação

```bash
curl -X POST http://localhost:3000/api/v1/pubsub/chat:room:42 -H "Content-Type: application/json" -d '{
  "message": {
    "from": "user:alex",
    "text": "Olá, pessoal!",
    "timestamp": "2025-10-15T18:22:00Z"
  }
}'
```

**Equivalente Redis:**
```redis
PUBLISH chat:room:42 '{"from":"user:alex","text":"Olá, pessoal!","timestamp":"2025-10-15T18:22:00Z"}'
```

#### Subscriber (Node.js usando ioredis)

```js
import Redis from "ioredis";

const subscriber = new Redis();

subscriber.subscribe("chat:room:42", (err, count) => {
  if (err) console.error("Erro ao subscrever:", err);
  else console.log(`Subscrito em ${count} canal(is).`);
});

subscriber.on("message", (channel, message) => {
  console.log(`[${channel}] Nova mensagem:`, JSON.parse(message));
});
```

#### Publisher (Node.js)

```js
import Redis from "ioredis";

const publisher = new Redis();
publisher.publish("chat:room:42", JSON.stringify({
  from: "user:luna",
  text: "Olá, Alex! Tudo bem?",
  timestamp: new Date().toISOString()
}));
```

**Saída esperada:**
```
[chat:room:42] Nova mensagem: { from: 'user:luna', text: 'Olá, Alex! Tudo bem?', timestamp: '2025-10-15T18:22:10Z' }
```

---

### Caso de Uso 3: Integração Entre Microserviços

**Cenário:**  
Um microserviço de **pedidos** publica eventos no canal `orders:new`.  
Outros serviços (ex: faturamento, estoque) se inscrevem para reagir a esses eventos.

#### Publisher (REST ou Redis CLI)

```bash
curl -X POST http://localhost:3000/api/v1/pubsub/orders:new -H "Content-Type: application/json" -d '{
  "message": {
    "orderId": "ORD-1001",
    "customer": "user:300",
    "total": 129.90
  }
}'
```

**Equivalente Redis:**
```redis
PUBLISH orders:new '{"orderId":"ORD-1001","customer":"user:300","total":129.90}'
```

#### Subscriber (Worker Node.js)

```js
const Redis = require("ioredis");
const sub = new Redis();

sub.subscribe("orders:new");

sub.on("message", (channel, msg) => {
  const order = JSON.parse(msg);
  console.log(`Novo pedido recebido: ${order.orderId} - Total: ${order.total}`);
});
```

---

## 4. Monitorando Canais Ativos

Para verificar quais canais têm listeners conectados:

```redis
PUBSUB CHANNELS
```

**Saída:**
```
1) "new_posts"
2) "chat:room:42"
3) "orders:new"
```

Para saber quantos subscribers estão em cada canal:

```redis
PUBSUB NUMSUB new_posts chat:room:42
```

**Saída:**
```
1) "new_posts"
2) (integer) 5
3) "chat:room:42"
4) (integer) 2
```

---

## 5. Padrões de Subscrição (PSUBSCRIBE)

Você pode se inscrever em múltiplos canais por padrão:

```redis
PSUBSCRIBE "chat:room:*"
```

**Recebe:**
- `chat:room:1`
- `chat:room:2`
- `chat:room:42`

Útil para workers genéricos que processam várias salas.

---

## 6. Boas Práticas

✅ Use **nomes de canal semânticos** (`chat:room:42`, `orders:new`, `notifications:user:123`).  
✅ Combine Pub/Sub com **WebSockets** para entregar notificações a clientes web.  
✅ Evite mensagens críticas no Pub/Sub — ele **não garante entrega**.  
✅ Para persistência, combine com **Streams** ou **Listas** (ex: `XADD` + `SUBSCRIBE`).  
✅ Para escala, use **Redis Cluster** ou **Redis Streams** como fallback persistente.

---

## 7. Conclusão

O **Pub/Sub** do Redis é um dos meios mais rápidos e simples para comunicação em tempo real entre sistemas distribuídos.

É ideal para:
- Notificações instantâneas;
- Chats e mensagens diretas;
- Streaming de eventos entre microserviços;
- Broadcast de atualizações de estado.

Quando precisão e persistência são necessárias, o Pub/Sub pode ser combinado com **Redis Streams**, unindo **latência mínima** com **resiliência de entrega**.
