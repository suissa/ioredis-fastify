# Streams (Redis Streams)

Este documento detalha o uso dos endpoints para manipulação da estrutura de dados **Stream** no Redis.

---

## 1. O Conceito: Streams

Um **Stream** do Redis é uma estrutura de dados poderosa e versátil que funciona como um **log de eventos, apenas de adição (append-only)**.  
Pense nela como um **arquivo de log**, onde novas entradas são sempre adicionadas no final.

### Principais Características

- **Persistente:**  
  Diferente do Pub/Sub, as mensagens em um Stream são **armazenadas** até serem explicitamente apagadas.  
  Isso permite reprocessar eventos e manter histórico.

- **ID Único e Ordenado:**  
  Cada entrada possui um **ID incremental único** (formado por `timestamp-sequência`), garantindo ordenação cronológica.

- **Grupos de Consumidores (Consumer Groups):**  
  Permite que múltiplos consumidores leiam o mesmo Stream de forma **coordenada**,  
  garantindo que **cada mensagem seja processada apenas uma vez por grupo**, ideal para sistemas escaláveis de eventos.

---

### Analogia com o Mundo Real

Imagine um **feed global de notícias em tempo real**, como o **Twitter (X)**.  
A chave poderia ser `feed:global`.

Cada novo tweet (`XADD`) é uma nova entrada no Stream, com um ID único.  
Vários sistemas podem ler esse feed de maneiras diferentes:

- Um cliente (app) lê **somente novos tweets** em tempo real.  
- Um sistema de analytics lê **todo o histórico** para gerar relatórios.  
- Outro serviço consome apenas **tweets de um determinado usuário**.

---

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Rastreamento de Eventos (Event Sourcing)

**Cenário:**  
Em uma aplicação de e-commerce, queremos registrar cada ação importante de um pedido —  
exemplo: `pedido_criado`, `pagamento_aprovado`, `produto_enviado`.

#### Adicionar um novo evento ao Stream

```bash
curl -X POST http://localhost:3000/api/v1/streams/order_events:123 -H "Content-Type: application/json" -d '{
  "values": {
    "event": "pedido_criado",
    "order_id": "123",
    "timestamp": "2024-10-15T10:32:00Z"
  }
}'
```

**O que acontece:**  
Internamente, o Redis executa `XADD` na chave `order_events:123`,  
criando uma nova entrada com ID automático (`<timestamp>-<sequência>`).

#### Ler todos os eventos de um pedido

```bash
curl "http://localhost:3000/api/v1/streams/order_events:123?start=0-0&end=+"
```

**O que acontece:**  
A API usa `XRANGE` para listar todas as mensagens do Stream (`0-0` até o final).  

**Resposta esperada:**

```json
[
  {
    "id": "1728978720000-0",
    "fields": {
      "event": "pedido_criado",
      "order_id": "123",
      "timestamp": "2024-10-15T10:32:00Z"
    }
  }
]
```

---

### Caso de Uso 2: Processamento em Tempo Real (Consumer Groups)

**Cenário:**  
Queremos que múltiplos consumidores processem eventos em paralelo,  
mas **sem duplicação de processamento**.

#### Criar um grupo de consumidores

```bash
curl -X POST http://localhost:3000/api/v1/streams/order_events:123/groups -H "Content-Type: application/json" -d '{
  "group": "processadores_pedidos",
  "start_id": "0"
}'
```

**O que acontece:**  
Internamente é executado `XGROUP CREATE order_events:123 processadores_pedidos 0`,  
criando o grupo de consumidores.

#### Ler mensagens pendentes para um consumidor específico

```bash
curl "http://localhost:3000/api/v1/streams/order_events:123/read?group=processadores_pedidos&consumer=worker-1"
```

**O que acontece:**  
A API usa `XREADGROUP` para entregar mensagens **não processadas** ao consumidor `"worker-1"`.

#### Confirmar o processamento de uma mensagem

```bash
curl -X POST http://localhost:3000/api/v1/streams/order_events:123/ack -H "Content-Type: application/json" -d '{
  "group": "processadores_pedidos",
  "id": "1728978720000-0"
}'
```

**O que acontece:**  
Executa `XACK`, confirmando que a mensagem foi processada e pode ser removida da lista de pendentes do grupo.

---

### Caso de Uso 3: Stream Global de Logs

**Cenário:**  
Queremos registrar logs de sistema centralizados no Redis para auditoria e visualização em tempo real.

#### Adicionar logs

```bash
curl -X POST http://localhost:3000/api/v1/streams/system_logs -H "Content-Type: application/json" -d '{
  "values": {
    "level": "error",
    "service": "auth",
    "message": "Falha na autenticação de usuário"
  }
}'
```

#### Ler apenas os 5 logs mais recentes

```bash
curl "http://localhost:3000/api/v1/streams/system_logs/recent?count=5"
```

**O que acontece:**  
A API usa `XREVRANGE` para retornar as últimas 5 mensagens, em ordem decrescente de ID.

**Resposta esperada:**

```json
[
  {
    "id": "1728979001000-0",
    "fields": {
      "level": "error",
      "service": "auth",
      "message": "Falha na autenticação de usuário"
    }
  }
]
```

---

## 3. Comandos Redis Utilizados

| Comando | Descrição |
|----------|------------|
| **XADD** | Adiciona uma nova entrada no Stream |
| **XRANGE** | Retorna uma faixa de mensagens em ordem crescente |
| **XREVRANGE** | Retorna mensagens em ordem decrescente |
| **XREAD** | Lê mensagens de um ou mais Streams |
| **XGROUP CREATE** | Cria um grupo de consumidores |
| **XREADGROUP** | Lê mensagens associadas a um grupo específico |
| **XACK** | Confirma que uma mensagem foi processada |
| **XPENDING** | Lista mensagens pendentes de confirmação |
| **XDEL** | Remove mensagens específicas |
| **XLEN** | Retorna o número total de mensagens em um Stream |

---

## 4. Padrões de Uso Comuns

### Event Sourcing
- Cada entidade (pedido, usuário, transação) possui seu próprio Stream (`order_events:123`).
- Facilita a **reconstrução de estado** e **auditoria completa**.

### Fila Durável com Grupos
- Use **XGROUP** + **XREADGROUP** para criar filas de mensagens persistentes.
- Evita perda de dados em caso de falhas do consumidor.

### Log Centralizado
- Combine Streams com **XTRIM** para limitar o tamanho do histórico:
  ```redis
  XTRIM system_logs MAXLEN 1000
  ```
  Assim, apenas os últimos 1000 logs são mantidos.

---

## 5. Boas Práticas

✅ **Prefixos de Chave:**  
Organize Streams por domínio:  
`order_events:*`, `user_events:*`, `logs:*`.

✅ **Truncamento Controlado:**  
Use `XTRIM` para limitar o tamanho de Streams longos.

✅ **Grupos de Consumidores:**  
Planeje grupos com nomes claros (ex: `processadores_pedidos`, `logs_analiticos`).

✅ **Idempotência:**  
Certifique-se de que os consumidores possam reprocessar mensagens sem efeitos duplicados.

---

## 6. Conclusão

Os **Streams** são uma das estruturas mais poderosas do Redis, unindo **persistência**, **ordenação temporal** e **consumo paralelo coordenado**.  

São ideais para:
- Logs e auditorias;
- Processamento de eventos;
- Integrações assíncronas;
- Sistemas de mensageria duráveis e escaláveis.

**Em resumo:**
- São “logs inteligentes” com IDs ordenados.  
- Permitem múltiplos consumidores coordenados.  
- Servem de base para arquiteturas reativas e de event sourcing.
