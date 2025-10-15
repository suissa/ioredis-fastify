# Hashes

​Este documento detalha o uso dos endpoints para manipulação da estrutura de dados Hash no Redis.
​
1. O Conceito: Hashes
​Um Hash no Redis é uma estrutura de dados que mapeia campos (strings) para valores (strings). É ideal para representar objetos. Em vez de serializar um objeto inteiro como JSON numa única chave de string, os Hashes permitem aceder e modificar campos individuais de forma eficiente.
​Eficiência: Modificar um campo de um objeto (ex: atualizar a idade de um utilizador) é muito mais rápido com um Hash, pois não é preciso ler, desserializar, modificar e re-serializar o objeto inteiro.
​Organização: Agrupa todos os atributos de uma entidade sob uma única chave.
​Analogia com o Mundo Real:
Pense numa ficha de dados de uma pessoa guardada num arquivo. A chave principal seria o número de identificação da pessoa (ex: pessoa:123). Dentro dessa ficha (o Hash), existem vários campos como "Nome", "Idade", "Email", cada um com o seu respetivo valor. Você pode pedir para ver apenas a "Idade" da pessoa sem precisar de ler a ficha inteira.

​2. Exemplos de Uso com a API
​Caso de Uso 1: Armazenar e Gerir Perfis de Utilizador
​Cenário: A nossa aplicação precisa de aceder frequentemente aos dados do perfil de um utilizador. Armazená-los num Hash no Redis é uma forma de cache muito eficaz.
​Comando curl:
Para guardar os dados do utilizador com ID 101: 
