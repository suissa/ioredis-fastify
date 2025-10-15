Documentação da API: Hashes
Este documento detalha o uso dos endpoints para manipulação da estrutura de dados Hash no Redis.

## 1. O Conceito: Hashes
Um Hash no Redis é uma estrutura de dados que mapeia campos (strings) para valores (strings). É ideal para representar objetos. Em vez de serializar um objeto inteiro como JSON numa única chave de string, os Hashes permitem aceder e modificar campos individuais de forma eficiente.
Eficiência: Modificar um campo de um objeto (ex: atualizar a idade de um utilizador) é muito mais rápido com um Hash, pois não é preciso ler, desserializar, modificar e re-serializar o objeto inteiro.
Organização: Agrupa todos os atributos de uma entidade sob uma única chave.
Analogia com o Mundo Real: Pense numa ficha de dados de uma pessoa guardada num arquivo. A chave principal seria o número de identificação da pessoa (ex: pessoa:123). Dentro dessa ficha (o Hash), existem vários campos como "Nome", "Idade", "Email", cada um com o seu respetivo valor. Você pode pedir para ver apenas a "Idade" da pessoa sem precisar de ler a ficha inteira.

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Armazenar e Gerir Perfis de Utilizador

Cenário: A nossa aplicação precisa de aceder frequentemente aos dados do perfil de um utilizador. Armazená-los num Hash no Redis é uma forma de cache muito eficaz.
Comando curl: Para guardar os dados do utilizador com ID 101:
```
curl -X POST http://localhost:3000/api/v1/hashes/user:101 \
-H "Content-Type: application/json" \
-d '{
    "name": "Carlos Pereira",
    "email": "carlos.p@exemplo.com",
    "username": "carlosp",
    "signup_date": "2024-10-15"
}'
```

O que acontece: Criamos (ou atualizamos) um Hash na chave user:101 com os campos name, email, username, e signup_date.

Para obter todos os dados do perfil desse utilizador:
`curl http://localhost:3000/api/v1/hashes/user:101`


Resposta Esperada:
```json
{
    "name": "Carlos Pereira",
    "email": "carlos.p@exemplo.com",
    "username": "carlosp",
    "signup_date": "2024-10-15"
}
```

### Caso de Uso 2: Gerir um Carrinho de Compras
Cenário: Um site de e-commerce precisa de gerir os produtos no carrinho de compras de um utilizador. Cada carrinho é um Hash, onde a chave principal é o ID do carrinho (ex: cart:98765) e os campos são os IDs dos produtos, e os valores são as quantidades.
Comando curl: Adicionar dois produtos ao carrinho de um utilizador:

```
curl -X POST http://localhost:3000/api/v1/hashes/cart:98765 \
-H "Content-Type: application/json" \
-d '{
    "product:345": "2",
    "product:512": "1"
}'
```

O que acontece: O Hash cart:98765 agora contém dois campos, product:345 com valor 2 (quantidade) e product:512 com valor 1.
Se o utilizador decidir aumentar a quantidade do primeiro produto:

```
curl -X POST http://localhost:3000/api/v1/hashes/cart:98765 \
-H "Content-Type: application/json" \
-d '{
    "product:345": "3"
}'
```

O que acontece: O comando HSET (usado internamente pelo nosso POST) simplesmente atualiza o valor do campo existente. É muito mais eficiente do que reescrever um JSON inteiro.
