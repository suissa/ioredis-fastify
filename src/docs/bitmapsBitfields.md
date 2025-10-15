# Bitmaps e Bitfields (Redis Bit Operations)

Este documento detalha o uso dos endpoints para manipulação de **Bitmaps** e **Bitfields** no Redis.

---

## 1. O Conceito: Bitmaps

Um **Bitmap** não é um tipo de dado real no Redis, mas sim uma **forma de interpretar strings binárias**.  
Cada bit (0 ou 1) dentro de uma string pode representar um estado booleano (ex: ativo/inativo).

### Características

- **Eficiência de espaço:**  
  1 milhão de bits (≈ 125 KB) pode representar 1 milhão de usuários ativos/inativos.

- **Operações a nível de bit:**  
  Você pode definir, ler, somar e combinar bits com operações lógicas (`AND`, `OR`, `XOR`, `NOT`).

- **Persistência automática:**  
  Por ser armazenado como string, o Bitmap é persistente como qualquer outro valor no Redis.

---

### Analogia com o Mundo Real

Imagine uma **lista de presença** de uma turma de 30 alunos ao longo de um mês.

- Cada aluno tem uma “folha” com 30 quadradinhos — um para cada dia.  
- Cada quadradinho representa um **bit** (0 = ausente, 1 = presente).  
- No fim, é fácil contar presenças (`BITCOUNT`) ou comparar folhas (`BITOP AND`).

---

## 2. Comandos Fundamentais

| Comando | Descrição |
|----------|------------|
| **SETBIT key offset value** | Define o bit na posição *offset* (0 ou 1) |
| **GETBIT key offset** | Retorna o valor do bit na posição *offset* |
| **BITCOUNT key [start end]** | Conta o número de bits 1 em uma faixa |
| **BITOP AND/OR/XOR/NOT destkey key1 [key2...]** | Executa operações bitwise entre bitmaps |
| **BITFIELD key [subcomandos]** | Manipula grupos de bits como inteiros (assina ou não) |

---

## 3. Exemplos de Uso com a API

### Caso de Uso 1: Rastrear Atividade Diária de Usuários (DAU/MAU)

**Cenário:**  
Queremos saber se o usuário esteve ativo em determinado dia do ano.  
Cada dia corresponde a um **offset** de 0 a 364.

#### Marcar o usuário como ativo no dia atual

```bash
curl -X POST http://localhost:3000/api/v1/bitmaps/user:123 -H "Content-Type: application/json" -d '{ "offset": 288, "value": 1 }'
```

**O que acontece:**  
Executa `SETBIT user:123 288 1`, marcando o dia 288 como “ativo”.

#### Verificar se o usuário esteve ativo em um dia específico

```bash
curl "http://localhost:3000/api/v1/bitmaps/user:123?offset=288"
```

**Equivalente Redis:**  
```redis
GETBIT user:123 288
```

**Resposta:**
```json
{ "day": 288, "active": true }
```

#### Contar os dias em que o usuário esteve ativo

```bash
curl "http://localhost:3000/api/v1/bitmaps/user:123/count"
```

**Equivalente Redis:**
```redis
BITCOUNT user:123
```

**Resposta:**
```json
{ "days_active": 24 }
```

---

### Caso de Uso 2: Comparar Atividade entre Usuários

**Cenário:**  
Queremos saber em quais dias dois usuários (`user:123` e `user:456`) estiveram ativos ao mesmo tempo.

#### Combinar bitmaps

```bash
curl -X POST http://localhost:3000/api/v1/bitmaps/compare -H "Content-Type: application/json" -d '{
  "operation": "AND",
  "keys": ["user:123", "user:456"],
  "destination": "active_both"
}'
```

**Equivalente Redis:**
```redis
BITOP AND active_both user:123 user:456
```

Depois é só contar:
```redis
BITCOUNT active_both
```

**Resultado:**  
Número de dias em que ambos estiveram ativos.

---

### Caso de Uso 3: Estatísticas Semanais de Login

**Cenário:**  
Cada bit representa se um login aconteceu naquele dia.

#### Registrar logins

```bash
# Segunda (offset 0)
SETBIT logins:semana42 0 1
# Terça (offset 1)
SETBIT logins:semana42 1 1
# Quarta (offset 2)
SETBIT logins:semana42 2 0
# ...
```

#### Consultar total de logins na semana

```bash
BITCOUNT logins:semana42
```

**Resposta:**
```
5  (5 dias com login)
```

#### Consultar se houve login no domingo (offset 6)

```bash
GETBIT logins:semana42 6
```
**Retorno:**
```
0
```

---

## 4. Operações Bitwise

As operações lógicas são extremamente poderosas para agregação de dados:

| Operação | Exemplo | Significado |
|-----------|----------|-------------|
| **AND** | `BITOP AND ativo_mes user:jan user:fev` | Usuários ativos em *ambos* os meses |
| **OR** | `BITOP OR ativo_total user:jan user:fev` | Usuários ativos em *pelo menos um* mês |
| **XOR** | `BITOP XOR mudaram user:jan user:fev` | Usuários que *mudaram* de estado |
| **NOT** | `BITOP NOT inativos user:jan` | Inversão dos bits de um bitmap |

---

## 5. Bitfields — Manipulando Inteiros nos Bits

O comando `BITFIELD` permite ler e escrever **valores inteiros** compactados dentro de um Bitmap.

### Conceito
Você pode reservar grupos de bits (ex: 8, 16, 32 bits) para representar números pequenos.  
Isso é extremamente útil para armazenar contadores, flags e registros compactos.

---

### Caso de Uso 1: Armazenar Níveis de Jogadores

**Cenário:**  
Queremos armazenar o “nível” de 3 jogadores, cada um ocupando 8 bits dentro da mesma chave.

#### Adicionar valores

```bash
curl -X POST http://localhost:3000/api/v1/bitfields/game:levels -H "Content-Type: application/json" -d '{
  "operations": [
    { "type": "SET", "encoding": "u8", "offset": 0, "value": 5 },
    { "type": "SET", "encoding": "u8", "offset": 8, "value": 12 },
    { "type": "SET", "encoding": "u8", "offset": 16, "value": 20 }
  ]
}'
```

**Equivalente Redis:**
```redis
BITFIELD game:levels SET u8 0 5 SET u8 8 12 SET u8 16 20
```

#### Ler o valor do segundo jogador

```bash
curl "http://localhost:3000/api/v1/bitfields/game:levels?encoding=u8&offset=8"
```

**Equivalente Redis:**
```redis
BITFIELD game:levels GET u8 8
```

**Resposta:**
```json
{ "level": 12 }
```

---

### Caso de Uso 2: Contadores Compactos

**Cenário:**  
Queremos armazenar vários contadores (por exemplo, tentativas de login) em uma única chave compactada.

#### Incrementar um contador (8 bits)

```bash
BITFIELD login:attempts INCRBY u8 0 1
```

**Explicação:**
- `INCRBY` → incrementa o campo
- `u8` → campo sem sinal de 8 bits
- `offset 0` → começa no primeiro bit

**Resultado:**  
Cada usuário pode ter um contador de 0 a 255 sem precisar de uma chave separada.

---

### Caso de Uso 3: Manipular Flags Binárias

Imagine que cada bit representa um **estado booleano** de permissões de um usuário:

| Bit | Permissão |
|-----|------------|
| 0 | Pode logar |
| 1 | Pode editar |
| 2 | É admin |
| 3 | Está suspenso |

#### Ativar e ler permissões

```bash
# Ativar bits 0 e 1
SETBIT user:flags 0 1
SETBIT user:flags 1 1

# Verificar se é admin
GETBIT user:flags 2
```

#### Contar permissões ativas

```bash
BITCOUNT user:flags
```
**Resultado:**
```
2
```

---

## 6. Boas Práticas

✅ **Mapeie bem offsets e significados:**  
Mantenha uma tabela de qual bit representa o quê.

✅ **Combine Bitmaps + Sets:**  
Use Bitmaps para flags binárias e Sets para entidades nomeadas.

✅ **Evite overflow em Bitfields:**  
Defina corretamente o tipo (`u8`, `i16`, etc.) para não ultrapassar o tamanho.

✅ **Compressão inteligente:**  
Use Bitfields quando precisar armazenar muitos inteiros pequenos (pontuações, contadores, estados).

---

## 7. Conclusão

Os **Bitmaps e Bitfields** são ideais para representar grandes volumes de dados binários ou numéricos compactos.

Usos típicos:
- Métricas de usuários ativos (DAU/MAU)
- Flags de permissões
- Contadores embutidos
- Jogos e sistemas de ranking
- Análise de eventos booleanos massivos

Com apenas algumas chaves, é possível armazenar milhões de estados booleanos ou inteiros compactos — e processá-los em microssegundos.
