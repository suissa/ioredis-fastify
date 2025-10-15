# Listas
Este documento detalha o uso dos endpoints para manipulação da estrutura de dados Lista no Redis.

## 1. O Conceito: Listas

Uma Lista no Redis é uma coleção de strings ordenadas pela ordem de inserção. Pense nela como um array. Pode adicionar elementos ao início (cabeça) ou ao fim (cauda) da lista, tornando-a ideal para implementar filas e pilhas.
 * Ordenada: Os elementos mantêm a ordem em que foram inseridos.
 * Não Única: Pode conter valores duplicados.
 * Eficiente: As operações de inserção/remoção nas extremidades (LPUSH, RPUSH, LPOP, RPOP) são extremamente rápidas (O(1)).
Analogia com o Mundo Real:
Imagine uma fila de espera para atendimento num balcão. Quando uma nova pessoa chega, ela entra no fim da fila (RPUSH). Quando um atendente fica livre, ele chama a primeira pessoa da fila (LPOP). Isto é um exemplo clássico de uma fila FIFO (First-In, First-Out) implementada com uma Lista.

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Fila de Tarefas (Background Jobs)

Cenário: A nossa aplicação precisa de processar tarefas que demoram algum tempo, como enviar e-mails ou redimensionar imagens. Em vez de bloquear a resposta ao utilizador, "enfileiramos" a tarefa para que um processo em segundo plano (um "worker") a execute mais tarde.
Comando curl:
```
Para adicionar uma nova tarefa de envio de e-mail à fila email_queue:
curl -X POST http://localhost:3000/api/v1/lists/email_queue \
-H "Content-Type: application/json" \
-d '{
    "values": [
        "{\"to\": \"user@exemplo.com\", \"subject\": \"Bem-vindo!\"}"
    ],
    "direction": "left"
}'
```

 * O que acontece: Usamos LPUSH (direction: left) para adicionar um objeto JSON (como string) ao início da lista. O worker, por sua vez, usaria RPOP para retirar a tarefa mais antiga da fila, garantindo um processamento FIFO.

### Caso de Uso 2: Timeline de Atividades Recentes

Cenário: Queremos mostrar as últimas 10 ações que um utilizador realizou no nosso site (ex: "fez login", "publicou um post", "atualizou o perfil").
Comando curl:
Cada vez que o utilizador user:123 realiza uma ação, adicionamos uma descrição ao início da sua timeline:
```
curl -X POST http://localhost:3000/api/v1/lists/timeline:user:123 \
-H "Content-Type: application/json" \
-d '{
    "values": ["Utilizador publicou o post ''Minhas Férias''"],
    "direction": "left"
}'
```

 * O que acontece: LPUSH (direction: left) adiciona a nova atividade no topo da lista. Com o tempo, as atividades mais antigas vão para o "fundo".
Para obter as 10 atividades mais recentes:
`curl "http://localhost:3000/api/v1/lists/timeline:user:123?start=0&stop=9"`

 * O que acontece: O comando LRANGE (usado internamente pelo nosso GET) obtém os elementos do índice 0 ao 9, que são exatamente as 10 atividades mais recentes.
 
