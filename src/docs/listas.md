# Listas (Redis Lists)

Este documento detalha o uso dos endpoints para manipulação da estrutura de dados **Lista** no Redis.

---

## 1. O Conceito: Listas

Uma **Lista** no Redis é uma **coleção de strings ordenadas pela ordem de inserção**.  
Pense nela como um **array dinâmico**, onde é possível adicionar elementos tanto no início (cabeça) quanto no fim (cauda).  
Isso a torna ideal para implementar **filas (queues)** e **pilhas (stacks)**.

### Principais Características

- **Ordenada:** Os elementos mantêm a ordem de inserção.  
- **Não Única:** Permite valores duplicados.  
- **Eficiente:** Inserções e remoções nas extremidades são operações O(1).  
  - `LPUSH` e `LPOP` → cabeça da lista  
  - `RPUSH` e `RPOP` → cauda da lista  

### Analogia com o Mundo Real

Imagine uma **fila de espera** em um balcão:

- Quando uma nova pessoa chega, ela entra no fim da fila (`RPUSH`).  
- Quando o atendente chama alguém, ele retira a primeira pessoa da fila (`LPOP`).  

Isso representa o comportamento **FIFO (First-In, First-Out)** clássico de uma **Lista Redis**.

---

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Fila de Tarefas (Background Jobs)

**Cenário:**  
A aplicação precisa processar tarefas demoradas (como envio de e-mails ou redimensionamento de imagens).  
Em vez de bloquear a resposta do usuário, "enfileiramos" a tarefa para execução assíncrona por um **worker** em segundo plano.

#### Adicionar uma nova tarefa à fila

```bash
curl -X POST http://localhost:3000/api/v1/lists/email_queue -H "Content-Type: application/json" -d '{
  "values": [
    "{"to": "user@exemplo.com", "subject": "Bem-vindo!"}"
  ],
  "direction": "left"
}'
```

**O que acontece:**  
O comando interno `LPUSH` adiciona a tarefa no **início** da lista `email_queue`.  
O **worker**, por sua vez, usa `RPOP` para processar a tarefa mais antiga, garantindo a lógica **FIFO**.

#### Visualizar tarefas na fila

```bash
curl http://localhost:3000/api/v1/lists/email_queue
```

**Resposta esperada (exemplo):**

```json
[
  "{"to": "user@exemplo.com", "subject": "Bem-vindo!"}",
  "{"to": "outro@exemplo.com", "subject": "Recuperar senha"}"
]
```

---

### Caso de Uso 2: Timeline de Atividades Recentes

**Cenário:**  
Queremos exibir as **últimas 10 ações** realizadas por um utilizador (login, posts, atualizações de perfil, etc).

#### Adicionar nova atividade

Cada vez que o utilizador `user:123` realiza uma ação, adicionamos uma entrada no início da lista `timeline:user:123`:

```bash
curl -X POST http://localhost:3000/api/v1/lists/timeline:user:123 -H "Content-Type: application/json" -d '{
  "values": ["Utilizador publicou o post 'Minhas Férias'"],
  "direction": "left"
}'
```

**O que acontece:**  
`LPUSH` adiciona a nova atividade no topo da lista.  
As mais antigas são empurradas para o fim com o tempo.

#### Obter as 10 atividades mais recentes

```bash
curl "http://localhost:3000/api/v1/lists/timeline:user:123?start=0&stop=9"
```

**O que acontece:**  
Internamente, a API usa o comando `LRANGE` para buscar do índice `0` ao `9`.

**Resposta esperada (exemplo):**

```json
[
  "Utilizador publicou o post 'Minhas Férias'",
  "Utilizador fez login",
  "Utilizador atualizou o perfil"
]
```

---

## 3. Comandos Redis Utilizados

| Comando | Descrição |
|----------|------------|
| **LPUSH** | Adiciona elemento(s) no início da lista |
| **RPUSH** | Adiciona elemento(s) no final da lista |
| **LPOP** | Remove e retorna o primeiro elemento |
| **RPOP** | Remove e retorna o último elemento |
| **LRANGE** | Retorna um intervalo de elementos |
| **LLEN** | Retorna o tamanho da lista |
| **LTRIM** | Mantém apenas um intervalo de elementos e descarta o resto |

---

## 4. Padrões de Uso Comuns

### Filas de Mensagens

- `LPUSH` + `RPOP` → **FIFO**
- `RPUSH` + `LPOP` → **LIFO (pilha)**

### Timeline ou Feed de Atividades

- `LPUSH` a cada evento novo
- `LRANGE 0 9` para as últimas 10 ações

### Buffer Limitado

- `LPUSH` novo elemento  
- `LTRIM 0 99` para manter apenas os 100 itens mais recentes

---

## 5. Conclusão

As **Listas** são uma estrutura poderosa e versátil no Redis, permitindo criar:

- Filas de processamento assíncrono;  
- Timelines ou históricos de atividades;  
- Buffers circulares limitados;  
- Pilhas (LIFO) e filas (FIFO) eficientes.

Com poucas operações simples, é possível construir sistemas robustos de fila e cache de eventos em tempo real.
