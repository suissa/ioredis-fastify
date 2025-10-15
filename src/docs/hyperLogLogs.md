# HyperLogLogs (Redis HLL)

Este documento detalha o uso dos endpoints para manipulação da estrutura de dados **HyperLogLog (HLL)** no Redis.

---

## 1. O Conceito: HyperLogLog

O **HyperLogLog** é uma estrutura de dados **probabilística** usada para **estimar a cardinalidade** (número de elementos únicos) de um conjunto, de maneira extremamente eficiente em termos de **memória**.

### Características Principais

- **Estimativa, não exatidão:**  
  O HLL **não armazena os elementos reais**.  
  Ele calcula uma **estimativa** do número de itens únicos com erro padrão de aproximadamente **0,81%**.

- **Memória constante:**  
  Cada HyperLogLog consome cerca de **12 KB**,  
  independentemente de conter **100** ou **100 milhões de elementos**.

- **Eficiência extrema:**  
  Perfeito para cenários onde **a exatidão absoluta não é necessária**,  
  mas **escala e performance** são críticas (ex: analytics de tráfego web).

---

### Analogia com o Mundo Real

Imagine uma **autoestrada movimentada** e você quer saber **quantos carros únicos passaram** durante o dia.  
Registrar a placa de cada veículo seria como usar um **Set** — preciso, mas gigantesco.  
O **HyperLogLog**, por outro lado, usa amostragem e estatística para **estimar** o total com um erro de menos de 1%, ocupando o espaço de **uma folha de papel**.

---

## 2. Comandos Fundamentais

| Comando | Descrição |
|----------|------------|
| **PFADD key element [element ...]** | Adiciona elementos ao HLL |
| **PFCOUNT key [key ...]** | Retorna a estimativa da contagem de elementos únicos |
| **PFMERGE destkey sourcekey [sourcekey ...]** | Combina múltiplos HLLs em um único HLL |

---

## 3. Exemplos de Uso com a API

### Caso de Uso 1: Contar Visitantes Únicos em um Site

**Cenário:**  
Queremos contar quantos visitantes únicos o site teve hoje.  
Em vez de armazenar milhões de IPs em um `Set`, usamos um **HLL diário**.

#### Adicionar visitantes ao HLL diário

```bash
curl -X POST http://localhost:3000/api/v1/hyperloglogs/visitas:2025-10-15 -H "Content-Type: application/json" -d '{
  "elements": ["192.168.0.1", "192.168.0.2", "200.200.100.5"]
}'
```

**Equivalente Redis:**
```redis
PFADD visitas:2025-10-15 192.168.0.1 192.168.0.2 200.200.100.5
```

#### Obter a estimativa de visitantes únicos

```bash
curl "http://localhost:3000/api/v1/hyperloglogs/visitas:2025-10-15/count"
```

**Equivalente Redis:**
```redis
PFCOUNT visitas:2025-10-15
```

**Resposta:**
```json
{ "unique_visitors": 3 }
```

Mesmo com milhões de acessos, a memória usada continuará próxima de 12 KB.

---

### Caso de Uso 2: Contagem de Visitantes Únicos Semanais

**Cenário:**  
Queremos saber quantos visitantes únicos tivemos na semana —  
ou seja, a **união** dos visitantes de todos os dias.

#### Unir HyperLogLogs diários em um HLL semanal

```bash
curl -X POST http://localhost:3000/api/v1/hyperloglogs/merge -H "Content-Type: application/json" -d '{
  "destination": "visitas:semana:42",
  "sources": [
    "visitas:2025-10-13",
    "visitas:2025-10-14",
    "visitas:2025-10-15",
    "visitas:2025-10-16",
    "visitas:2025-10-17"
  ]
}'
```

**Equivalente Redis:**
```redis
PFMERGE visitas:semana:42 visitas:2025-10-13 visitas:2025-10-14 visitas:2025-10-15 visitas:2025-10-16 visitas:2025-10-17
```

#### Consultar o total estimado de visitantes únicos na semana

```bash
curl "http://localhost:3000/api/v1/hyperloglogs/visitas:semana:42/count"
```

**Equivalente Redis:**
```redis
PFCOUNT visitas:semana:42
```

---

### Caso de Uso 3: Contagem de Usuários Únicos por Região

**Cenário:**  
Queremos comparar quantos usuários únicos vieram de cada país.

#### Adicionar usuários por país

```bash
curl -X POST http://localhost:3000/api/v1/hyperloglogs/usuarios:brasil -H "Content-Type: application/json" -d '{ "elements": ["user:1", "user:2", "user:3"] }'

curl -X POST http://localhost:3000/api/v1/hyperloglogs/usuarios:argentina -H "Content-Type: application/json" -d '{ "elements": ["user:2", "user:4", "user:5"] }'
```

#### Obter contagens individuais

```bash
curl "http://localhost:3000/api/v1/hyperloglogs/usuarios:brasil/count"
curl "http://localhost:3000/api/v1/hyperloglogs/usuarios:argentina/count"
```

#### Unir e obter total combinado

```bash
curl -X POST http://localhost:3000/api/v1/hyperloglogs/merge -H "Content-Type: application/json" -d '{
  "destination": "usuarios:latam",
  "sources": ["usuarios:brasil", "usuarios:argentina"]
}'
```

**Equivalente Redis:**
```redis
PFMERGE usuarios:latam usuarios:brasil usuarios:argentina
PFCOUNT usuarios:latam
```

**Resposta esperada:**
```json
{ "unique_users": 5 }
```

---

### Caso de Uso 4: Análise de Tráfego por Página

**Cenário:**  
Cada página do site tem seu próprio HLL para estimar usuários únicos.

```bash
# /home
PFADD page:home user:1 user:2 user:3

# /about
PFADD page:about user:2 user:4

# /products
PFADD page:products user:1 user:3 user:5
```

**Análise combinada (todos os visitantes únicos do site):**
```redis
PFMERGE site:total page:home page:about page:products
PFCOUNT site:total
```

**Resposta estimada:**
```
5 usuários únicos
```

---

## 4. Precisão e Memória

| Aspecto | Detalhe |
|----------|----------|
| **Erro padrão** | ±0.81% |
| **Memória usada** | ≈ 12 KB por chave |
| **Comportamento** | A contagem cresce corretamente até cerca de 10⁹ elementos |
| **Tipo armazenado** | Internamente, uma string binária compactada |
| **Compatibilidade** | `PFCOUNT`, `PFADD` e `PFMERGE` são atômicos e seguros |

---

## 5. Quando Usar e Quando Não Usar

✅ **Use HyperLogLogs quando:**
- Precisa contar visitantes únicos ou eventos únicos.
- A precisão aproximada (erro < 1%) é aceitável.
- Deseja economizar memória com conjuntos massivos.

🚫 **Evite HyperLogLogs quando:**
- Precisa saber **quais elementos** foram inseridos (use Sets).
- A contagem precisa ser **exata**.
- Precisa de consultas condicionais (ex: “quem acessou duas vezes?”).

---

## 6. Boas Práticas

✅ Use nomes de chave padronizados (ex: `visitas:YYYY-MM-DD`).  
✅ Combine HLLs por período (ex: diário → semanal → mensal).  
✅ Utilize `PFMERGE` para consolidar períodos sem duplicar dados.  
✅ Prefira armazenar IDs estáveis (ex: hash do usuário, cookieID, IP anon).  
✅ Mantenha logs brutos apenas quando necessário para auditoria.

---

## 7. Conclusão

O **HyperLogLog** é uma das ferramentas mais eficientes do Redis para **contagem de elementos únicos** com consumo de memória fixo.

É ideal para:
- Métricas de usuários únicos (DAU, MAU, WAU);
- Analytics de tráfego e campanhas;
- Contagem de itens distintos em streams ou eventos;
- Sistemas de recomendação e agregação massiva.

Com erro menor que 1% e memória de apenas 12 KB por chave, o HyperLogLog oferece **escala quase infinita** com **custos insignificantes**.
