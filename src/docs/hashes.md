# Hashes (Redis Hashes)

Este documento detalha o uso dos endpoints para manipulação da estrutura de dados **Hash** no Redis.

---

## 1. O Conceito: Hashes

Um **Hash** no Redis é uma **estrutura de dados que mapeia campos (strings) para valores (strings)**.  
É ideal para representar **objetos**, pois permite acessar e modificar campos individuais de forma eficiente — sem precisar serializar e desserializar o objeto inteiro.

### Principais Características

- **Eficiência:**  
  Modificar apenas um campo (por exemplo, atualizar a idade de um utilizador) é muito mais rápido com um Hash, pois não é necessário ler, desserializar, modificar e regravar todo o objeto.

- **Organização:**  
  Agrupa todos os atributos de uma entidade sob uma única chave, o que melhora a legibilidade e a consistência dos dados.

---

### Analogia com o Mundo Real

Pense em uma **ficha de dados de uma pessoa** guardada em um arquivo físico.

- A chave principal seria o número de identificação da pessoa (exemplo: `pessoa:123`).
- Dentro dessa ficha (o **Hash**), existem vários campos como `"Nome"`, `"Idade"`, `"Email"`, cada um com seu valor.
- Você pode consultar apenas a `"Idade"` sem precisar ler toda a ficha.

Em termos práticos:
```redis
HSET pessoa:123 Nome "Carlos Pereira" Idade "29" Email "carlos@exemplo.com"
HGET pessoa:123 Idade
```

---

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Armazenar e Gerir Perfis de Utilizador

**Cenário:**  
A aplicação precisa acessar frequentemente aos dados do perfil de um utilizador.  
Armazenar esses dados em um **Hash** no Redis é uma forma eficiente de cache, evitando leituras completas de objetos JSON.

#### Criar ou atualizar o perfil de um utilizador

```bash
curl -X POST http://localhost:3000/api/v1/hashes/user:101 -H "Content-Type: application/json" -d '{
  "name": "Carlos Pereira",
  "email": "carlos.p@exemplo.com",
  "username": "carlosp",
  "signup_date": "2024-10-15"
}'
```

**O que acontece:**  
Cria (ou atualiza) um **Hash** na chave `user:101` com os campos `name`, `email`, `username` e `signup_date`.

#### Consultar todos os dados de um utilizador

```bash
curl http://localhost:3000/api/v1/hashes/user:101
```

**Resposta esperada:**

```json
{
  "name": "Carlos Pereira",
  "email": "carlos.p@exemplo.com",
  "username": "carlosp",
  "signup_date": "2024-10-15"
}
```

---

### Caso de Uso 2: Gerir um Carrinho de Compras

**Cenário:**  
Um site de e-commerce precisa gerir os produtos no carrinho de compras de um utilizador.  
Cada carrinho é um **Hash**, onde:
- A chave principal é o ID do carrinho (`cart:98765`).
- Os campos são os IDs dos produtos.
- Os valores são as **quantidades**.

#### Adicionar produtos ao carrinho

```bash
curl -X POST http://localhost:3000/api/v1/hashes/cart:98765 -H "Content-Type: application/json" -d '{
  "product:345": "2",
  "product:512": "1"
}'
```

**O que acontece:**  
O **Hash** `cart:98765` agora contém:
- `product:345` → quantidade `2`
- `product:512` → quantidade `1`

#### Atualizar a quantidade de um produto

```bash
curl -X POST http://localhost:3000/api/v1/hashes/cart:98765 -H "Content-Type: application/json" -d '{
  "product:345": "3"
}'
```

**O que acontece:**  
O comando interno `HSET` atualiza o valor do campo existente (`product:345`) de `2` para `3`.  
É uma operação direta e mais eficiente do que reescrever o JSON inteiro.

#### Consultar o carrinho completo

```bash
curl http://localhost:3000/api/v1/hashes/cart:98765
```

**Resposta esperada:**

```json
{
  "product:345": "3",
  "product:512": "1"
}
```

---

## 3. Comandos Redis Utilizados

| Comando | Descrição |
|----------|------------|
| **HSET** | Define um ou mais campos de um Hash |
| **HGET** | Obtém o valor de um campo específico |
| **HGETALL** | Retorna todos os pares campo/valor do Hash |
| **HDEL** | Remove um ou mais campos de um Hash |
| **HEXISTS** | Verifica se um campo existe |
| **HINCRBY** | Incrementa numericamente o valor de um campo |
| **HLEN** | Retorna o número de campos no Hash |
| **HKEYS** | Retorna todos os nomes de campos |
| **HVALS** | Retorna todos os valores do Hash |

---

## 4. Padrões de Uso Comuns

### Perfis de Usuário

- Cada utilizador tem uma chave única (`user:<id>`).  
- Cada campo representa uma propriedade (ex: nome, e-mail, data de cadastro).  
- Atualizações são rápidas e atômicas.

### Configurações de Sessão

- Hashes são ideais para guardar pares chave/valor temporários, como tokens e timestamps.

### Caches de Dados Parciais

- Em vez de armazenar um objeto inteiro em JSON, os Hashes permitem cachear apenas partes mutáveis.

---

## 5. Boas Práticas

✅ **Nomenclatura das Chaves:**  
Use prefixos semânticos (ex: `user:123`, `cart:456`) para facilitar debugging e agrupamento lógico.

✅ **Atualizações Atômicas:**  
Use `HINCRBY` e `HSET` para evitar condições de corrida (race conditions) em ambientes concorrentes.

✅ **TTL (Expiração):**  
Combine Hashes com `EXPIRE` para descartar automaticamente dados temporários (como sessões).

---

## 6. Conclusão

Os **Hashes** são uma das estruturas mais versáteis do Redis, equilibrando simplicidade e eficiência.  
Eles são perfeitos para representar **objetos, perfis, configurações e caches parciais** sem a sobrecarga de serialização completa.

**Em resumo:**
- Representam objetos com múltiplos campos.  
- Permitem acesso granular e atômico.  
- Mantêm a performance mesmo com alto volume de operações.
