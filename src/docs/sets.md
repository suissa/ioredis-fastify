# Sets (Conjuntos)

​Este documento detalha o uso dos endpoints para manipulação da estrutura de dados Set (Conjunto) no Redis.

## ​1. O Conceito: Sets

​Um Set no Redis é uma coleção de strings únicas e não ordenadas. A sua principal característica é a garantia de que não haverá elementos duplicados.
​Únicos: Tentar adicionar um elemento que já existe no Set é uma operação segura que não causa erro e simplesmente não altera o conjunto.
​Não Ordenados: O Redis não garante a ordem em que os elementos são retornados.
​Operações de Conjunto: São extremamente eficientes para operações matemáticas de conjuntos como união, interseção e diferença.

### ​Analogia com o Mundo Real:
Pense numa lista de convidados únicos para uma festa. A chave seria festa:aniversario. Você pode adicionar nomes (SADD). Se tentar adicionar "Maria" duas vezes, ela só aparecerá uma vez na lista. Você pode facilmente verificar se "João" está na lista (SISMEMBER) ou juntar a sua lista com a de outro anfitrião (SUNION).
​
## 2. Exemplos de Uso com a API
​Caso de Uso 1: Rastrear Utilizadores Online
​Cenário: Queremos saber, a qualquer momento, quais utilizadores estão online no nosso sistema, sem duplicados.
​Comando curl:
Quando o utilizador user:101 fica online, adicionamo-lo ao Set online_users: 
