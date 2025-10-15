Documentação da API: Chaves, Strings e Comandos Gerais
Este documento detalha o uso dos endpoints básicos para manipulação de chaves e valores do tipo String no Redis.
1. O Conceito: Chaves e Strings
No seu nível mais fundamental, o Redis é um armazém de dados chave-valor. Pense nele como um dicionário gigante onde cada "palavra" (a chave) tem uma "definição" (o valor).
 * Chaves: São sempre strings e servem como o identificador único para um dado. Ex: user:100, config:prod.
 * Strings: São o tipo de valor mais simples. Podem armazenar texto, números ou dados binários (como uma imagem serializada ou um objeto JSON) até um limite de 512 MB.
Analogia com o Mundo Real:
Imagine um bengaleiro de um teatro. Cada casaco que você entrega recebe um ticket com um número único (a chave). Para reaver o seu casaco específico (o valor), você precisa de apresentar esse ticket. A chave é a única forma de aceder ao valor guardado.
2. Exemplos de Uso com a API
Aqui estão cenários práticos de como utilizar os endpoints de chaves e strings.
Caso de Uso 1: Caching de uma Página HTML
Cenário: Temos uma página inicial que é pesada para gerar. Para evitar reprocessá-la a cada visita, podemos guardá-la em cache no Redis por 10 minutos.
Comando curl:
Primeiro, guardamos o conteúdo da página na chave cache:homepage.
curl -X POST http://localhost:3000/api/v1/keys/cache:homepage \
-H "Content-Type: application/json" \
-d '{
    "value": "<html><body><h1>Bem-vindo ao nosso site!</h1>...</body></html>",
    "ex": 600
}'

 * O que acontece: Estamos a definir a chave cache:homepage com o conteúdo HTML e a instruir o Redis a apagá-la automaticamente após 600 segundos (10 minutos).
Para obter a página do cache:
curl http://localhost:3000/api/v1/keys/cache:homepage

Caso de Uso 2: Contador de Visitantes Ativos
Cenário: Queremos manter um contador em tempo real de quantos utilizadores estão ativos no nosso site. O comando INCR é atómico, o que o torna perfeito para contadores concorrentes.
Comando curl:
Cada vez que um utilizador se torna ativo, enviamos este pedido:
curl -X POST http://localhost:3000/api/v1/keys/active_users/incr

 * O que acontece: O Redis incrementa o valor numérico na chave active_users em 1. Se a chave não existir, ele cria-a com o valor 1.
 * Resposta Esperada:
   { "key": "active_users", "value": 125 }

   (Onde 125 é o novo número de utilizadores ativos.)
Caso de Uso 3: Gestão de Sessões de Utilizador
Cenário: Quando um utilizador faz login, geramos um ID de sessão único e guardamos as informações do utilizador associadas a esse ID. A sessão deve expirar após 1 hora de inatividade.
Comando curl:
Guardar os dados da sessão. O ID da sessão é sess:xyz123abc.
curl -X POST http://localhost:3000/api/v1/keys/sess:xyz123abc \
-H "Content-Type: application/json" \
-d '{
    "value": {
        "userId": 101,
        "username": "ana.silva",
        "permissions": ["read", "write"]
    },
    "ex": 3600
}'

 * O que acontece: Guardamos um objeto JSON com os dados do utilizador. O ex: 3600 define a expiração para 1 hora.
Para validar a sessão, a aplicação pode verificar se a chave ainda existe:
curl -X POST http://localhost:3000/api/v1/keys/exists \
-H "Content-Type: application/json" \
-d '{
    "keys": ["sess:xyz123abc"]
}'

 * Resposta Esperada:
   { "existing_keys_count": 1 }

   (Se a sessão for válida.)
Caso de Uso 4: Verificação do Tipo de Chave para Debugging
Cenário: Um comando está a falhar e suspeitamos que outra parte da aplicação guardou dados com o tipo errado numa chave. Por exemplo, esperávamos uma string mas recebemos um hash.
Comando curl:
curl http://localhost:3000/api/v1/keys/user:101/type

 * Resposta Esperada:
   { "key": "user:101", "type": "hash" }

 * O que acontece: Este endpoint retorna o tipo de dado armazenado na chave, que pode ser string, hash, list, set, zset, stream ou none se não existir.
