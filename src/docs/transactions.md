# Transações (MULTI / EXEC)

Este documento detalha o uso dos endpoints para execução de **transações atômicas** no Redis.

---

## 1. O Conceito: Transações

Uma **transação no Redis** permite agrupar múltiplos comandos para execução como uma única operação — de forma **atômica** e **isolada**.

### Características Principais

- **Atomicidade:**  
  Todos os comandos dentro do bloco `MULTI` / `EXEC` são executados de uma só vez.  
  Nenhum outro cliente pode interferir durante o processamento.

- **Isolamento:**  
  A operação é “**tudo ou nada**”. Nenhum comando intermediário é visível até a execução final.

- **Sem Rollback Completo (antes do Redis 7):**  
  Se um comando falhar (erro de tipo, sintaxe etc.), o Redis **ainda executa os outros**.  
  No entanto, nossa API captura esses erros e **retorna resposta detalhada**, permitindo que a aplicação lide com exceções.  
  Se um `WATCH` detectar modificação de chave, toda a transação falha.

---

### Analogia com o Mundo Real

Imagine uma **transferência bancária**:

1. Debitar 50 € da conta A  
2. Creditar 50 € na conta B  

Essas duas operações **devem acontecer juntas**.  
Se a segunda falhar, a primeira precisa ser revertida — ou o sistema se corrompe.  
Uma transação Redis garante que **ambas as operações sejam aplicadas ou nenhuma delas**.

---

## 2. Comandos Fundamentais

| Comando | Descrição |
|----------|------------|
| **MULTI** | Inicia uma transação |
| **EXEC** | Executa todos os comandos enfileirados |
| **DISCARD** | Cancela a transação |
| **WATCH key [key ...]** | Monitora chaves e aborta a transação se forem alteradas |
| **UNWATCH** | Cancela o monitoramento |

---

## 3. Exemplo de Uso com a API

Nosso endpoint `/transaction` aceita uma lista de comandos,  
onde cada comando possui um nome e seus argumentos.

---

### Caso de Uso 1: Transferir Pontos de Jogo entre Jogadores

**Cenário:**  
Queremos permitir que `player:1` transfira **100 pontos** para `player:2`.  
Cada jogador tem sua pontuação guardada numa chave de string (`points:player:<id>`).

#### Requisição API

```bash
curl -X POST http://localhost:3000/api/v1/transaction -H "Content-Type: application/json" -d '{
  "commands": [
    ["DECRBY", "points:player:1", "100"],
    ["INCRBY", "points:player:2", "100"]
  ]
}'
```

**Equivalente Redis:**

```redis
MULTI
DECRBY points:player:1 100
INCRBY points:player:2 100
EXEC
```

**Resposta Esperada:**
```json
{
  "status": "success",
  "results": [900, 1100]
}
```

---

### Caso de Uso 2: Transação com WATCH (Controle de Concorrência)

**Cenário:**  
Queremos garantir que o saldo de `player:1` não seja alterado por outro processo  
entre o momento da leitura e a transferência.

#### Exemplo Redis CLI

```redis
WATCH points:player:1
val = GET points:player:1
if (val >= 100) {
  MULTI
  DECRBY points:player:1 100
  INCRBY points:player:2 100
  EXEC
} else {
  UNWATCH
}
```

**Explicação:**  
Se `points:player:1` for modificado antes de `EXEC`,  
a transação é **abortada automaticamente** (retorna `null`).

---

### Caso de Uso 3: Atualização de Múltiplos Campos de Perfil

**Cenário:**  
Atualizar informações do usuário (`user:123`) em uma única operação segura.

#### Requisição API

```bash
curl -X POST http://localhost:3000/api/v1/transaction -H "Content-Type: application/json" -d '{
  "commands": [
    ["HSET", "user:123", "email", "novo@email.com"],
    ["HSET", "user:123", "nickname", "astrodev"],
    ["HINCRBY", "user:123", "login_count", "1"]
  ]
}'
```

**Equivalente Redis:**

```redis
MULTI
HSET user:123 email novo@email.com
HSET user:123 nickname astrodev
HINCRBY user:123 login_count 1
EXEC
```

**Resultado:**
```json
{
  "status": "success",
  "updates": {
    "email": "novo@email.com",
    "nickname": "astrodev",
    "login_count": 11
  }
}
```

---

### Caso de Uso 4: Transação de Estoque em E-commerce

**Cenário:**  
Reduzir o estoque de um produto e registrar o pedido na mesma transação.

#### Requisição API

```bash
curl -X POST http://localhost:3000/api/v1/transaction -H "Content-Type: application/json" -d '{
  "commands": [
    ["DECRBY", "estoque:produto:3001", "1"],
    ["SADD", "pedidos:cliente:123", "pedido:789"]
  ]
}'
```

**Equivalente Redis:**
```redis
MULTI
DECRBY estoque:produto:3001 1
SADD pedidos:cliente:123 pedido:789
EXEC
```

---

## 4. Detecção de Erros e Retorno

**Cenário:**  
Se algum comando falhar (por tipo errado, chave inexistente etc.),  
a API responde com uma lista de resultados e erros individuais.

**Exemplo de resposta:**
```json
{
  "status": "partial_error",
  "results": [null, "OK"],
  "errors": [
    "ERR value is not an integer or out of range in DECRBY"
  ]
}
```

A aplicação cliente deve decidir se reexecuta ou cancela a operação.

---

## 5. Considerações sobre WATCH e Isolamento

- `WATCH` é ideal para **transações condicionais** (compare-and-set).  
- Ele monitora as chaves até `EXEC` — se qualquer uma for alterada, a transação é abortada.  
- Combine `WATCH` com reexecuções automáticas para garantir robustez.

---

## 6. Boas Práticas

✅ Sempre agrupe comandos que **dependem do mesmo estado**.  
✅ Use `WATCH` para garantir **consistência otimista**.  
✅ Prefira transações curtas — operações longas bloqueiam o cliente.  
✅ Não use transações para comandos independentes (use pipelines).  
✅ Combine com `EVAL` (Lua scripts) para lógica atômica avançada.  
✅ Se precisar de rollback real, implemente manualmente com compensação (undo logic).  

---

## 7. Conclusão

As **transações Redis (MULTI/EXEC)** oferecem atomicidade e isolamento de alto desempenho.  
São perfeitas para cenários como:

- Transferências de valores entre chaves;  
- Atualizações consistentes em múltiplos campos;  
- Controle de concorrência com `WATCH`;  
- Lógica atômica sem necessidade de locks.

Elas permitem implementar **operações complexas e seguras** com a simplicidade e velocidade do Redis.
