# Sets (Conjuntos)

Este documento detalha o uso dos endpoints para manipulação da estrutura de dados Set (Conjunto) no Redis.

---

## 1. O Conceito: Sets

Um Set no Redis é uma coleção de strings únicas e não ordenadas. Sua principal característica é a garantia de unicidade: cada elemento só pode aparecer uma vez.

### Características principais

- Unicidade: adicionar um elemento já existente é seguro; o Redis ignora duplicatas.
- Não ordenado: a ordem de retorno não é garantida.
- Operações de conjunto: união (SUNION), interseção (SINTER) e diferença (SDIFF).

---

## 2. Analogia simples

Pense em uma lista de convidados únicos para uma festa.

Chave sugerida:

```
festa:aniversario
```

- Ao adicionar nomes com SADD, se "Maria" for adicionada duas vezes, aparecerá uma única vez.
- Para verificar se "Joao" está na lista, use SISMEMBER.
- Para combinar duas listas de convidados, use SUNION.

---

## 3. Exemplos de uso com a API

### 3.1 Rastrear utilizadores online

Cenário: descobrir quem está online no momento, sem duplicações.

Adicionar um utilizador ao conjunto de online:

```bash
curl -X POST http://localhost:3000/api/v1/sets/online_users -H "Content-Type: application/json" -d '{
  "members": ["user:101"]
}'
```

Verificar se o utilizador está online:

```bash
curl http://localhost:3000/api/v1/sets/online_users/ismember/user:101
```

Resposta esperada:

```json
{ "isMember": true }
```

Listar todos os utilizadores online:

```bash
curl http://localhost:3000/api/v1/sets/online_users
```

Resposta (exemplo):

```json
["user:101", "user:202", "user:303"]
```

Remover um utilizador ao sair:

```bash
curl -X DELETE http://localhost:3000/api/v1/sets/online_users/user:101
```

Resultado: o user:101 é removido de online_users.

---

### 3.2 Operações entre conjuntos

Interseção entre dois conjuntos (quem está online no web e no mobile):

```bash
curl http://localhost:3000/api/v1/sets/intersect -H "Content-Type: application/json" -d '{
  "sets": ["online_web", "online_mobile"]
}'
```

Resposta (exemplo):

```json
["user:101", "user:207"]
```

---

## 4. Comandos Redis relacionados (resumo)

- SADD: adiciona membros.
- SISMEMBER: verifica a presença de um membro.
- SMEMBERS: lista todos os membros.
- SREM: remove membros.
- SUNION: união entre conjuntos.
- SINTER: interseção entre conjuntos.
- SDIFF: diferença entre conjuntos.
