# Geospatial (Redis Geo Commands)

Este documento detalha o uso dos endpoints para manipulação de **dados geoespaciais** no Redis.

---

## 1. O Conceito: Geospatial

As funcionalidades **geoespaciais** do Redis permitem armazenar **coordenadas geográficas (longitude e latitude)** associadas a membros, e realizar **consultas baseadas em localização**, como encontrar membros dentro de um determinado **raio de distância**.

### Principais Características

- **Armazenamento eficiente:**  
  Os dados são guardados internamente em um **Sorted Set**,  
  onde o *score* é uma codificação compacta da localização (**Geohash**).

- **Consultas por raio:**  
  O comando `GEOSEARCH` (ou o mais antigo `GEORADIUS`) permite encontrar todos os pontos que estão **dentro de um certo raio** de uma coordenada central.

- **Alta performance:**  
  As consultas geoespaciais são **otimizadas** e permitem filtros rápidos em grandes volumes de dados.

---

### Analogia com o Mundo Real

Pense em uma aplicação como **Uber** ou **iFood**.  
A chave poderia ser `motoristas_disponiveis`.

Cada motorista (membro) possui sua **localização** (`longitude`, `latitude`).  
Quando você abre o app, ele executa uma consulta (`GEOSEARCH`) para encontrar todos os motoristas **a menos de 5 km** da sua posição atual.

Exemplo visual:

| Membro | Latitude | Longitude |
|--------|-----------|-----------|
| motorista:101 | -23.55052 | -46.63331 |
| motorista:102 | -23.55300 | -46.64000 |
| motorista:103 | -23.55950 | -46.64580 |

A consulta geoespacial retornará apenas os motoristas dentro do raio configurado.

---

## 2. Exemplos de Uso com a API

### Caso de Uso 1: Encontrar Lojas Próximas

**Cenário:**  
Uma aplicação móvel precisa mostrar ao utilizador todas as **lojas da marca** dentro de um **raio de 5 km** da sua localização atual.

---

#### 1️⃣ Adicionar as localizações das lojas

A chave usada será `lojas:localizacao`.

```bash
curl -X POST http://localhost:3000/api/v1/geospatial/lojas:localizacao -H "Content-Type: application/json" -d '{
  "members": [
    { "name": "Loja Centro", "longitude": -46.633309, "latitude": -23.550520 },
    { "name": "Loja Norte", "longitude": -46.620000, "latitude": -23.540000 },
    { "name": "Loja Sul", "longitude": -46.650000, "latitude": -23.570000 }
  ]
}'
```

**O que acontece:**  
Internamente, o Redis usa o comando `GEOADD` para adicionar os pontos geoespaciais ao conjunto `lojas:localizacao`.

---

#### 2️⃣ Consultar lojas dentro de um raio de 5 km

```bash
curl "http://localhost:3000/api/v1/geospatial/lojas:localizacao/search?longitude=-46.633309&latitude=-23.550520&radius=5&unit=km"
```

**O que acontece:**  
A API executa o comando `GEOSEARCH` (ou `GEORADIUS`) com o ponto central e o raio fornecido.

**Resposta esperada:**

```json
[
  { "name": "Loja Centro", "distance": 0.0 },
  { "name": "Loja Norte", "distance": 1.7 },
  { "name": "Loja Sul", "distance": 3.1 }
]
```

---

### Caso de Uso 2: Calcular a Distância entre Duas Localizações

**Cenário:**  
Queremos calcular a **distância direta (em km)** entre duas lojas cadastradas.

```bash
curl "http://localhost:3000/api/v1/geospatial/lojas:localizacao/distance?from=Loja%20Centro&to=Loja%20Sul&unit=km"
```

**O que acontece:**  
Internamente é executado `GEODIST`, que calcula a distância entre as duas posições.

**Resposta esperada:**

```json
{ "distance": 3.14 }
```

---

### Caso de Uso 3: Obter Coordenadas de uma Loja Específica

```bash
curl "http://localhost:3000/api/v1/geospatial/lojas:localizacao/position/Loja%20Centro"
```

**O que acontece:**  
Executa `GEOPOS`, retornando as coordenadas salvas.

**Resposta esperada:**

```json
{
  "longitude": -46.633309,
  "latitude": -23.550520
}
```

---

## 3. Comandos Redis Utilizados

| Comando | Descrição |
|----------|------------|
| **GEOADD** | Adiciona localizações (longitude, latitude) a uma chave geoespacial |
| **GEOPOS** | Retorna a posição (longitude, latitude) de um membro |
| **GEODIST** | Calcula a distância entre dois membros |
| **GEOSEARCH** | Retorna membros dentro de um raio a partir de um ponto |
| **GEOSEARCHSTORE** | Armazena os resultados de uma busca em outra chave |
| **ZREM** | Remove um membro de um conjunto geoespacial (internamente um Sorted Set) |

---

## 4. Padrões de Uso Comuns

### Localização de Entidades
- Armazene localizações em chaves lógicas (`lojas:localizacao`, `clientes:coordenadas`).
- Use `GEOADD` para adicionar ou atualizar posições.

### Busca de Proximidade
- Use `GEOSEARCH` com raio em `km` ou `m` para consultas rápidas.
- Combine com filtros adicionais (ex: status, tipo de loja).

### Cálculo de Rotas e Distâncias
- `GEODIST` é útil para calcular trajetos diretos e proximidades médias.

---

## 5. Boas Práticas

✅ **Unidades padronizadas:**  
Prefira `km` ou `m` para manter consistência em consultas.  

✅ **Chaves semânticas:**  
Nomeie as chaves por contexto (`motoristas:ativos`, `lojas:geo`, `clientes:posicao`).  

✅ **Limpeza de dados antigos:**  
Remova localizações inativas (`ZREM`) periodicamente.  

✅ **Armazenamento temporal:**  
Combine com `Streams` para guardar o histórico de movimentações (rastreio GPS).  

---

## 6. Conclusão

Os **comandos geoespaciais** do Redis tornam simples e eficiente lidar com dados de localização.  
Eles são perfeitos para:

- Aplicações de entrega e transporte (Uber, iFood, 99);  
- Sistemas de recomendação baseados em proximidade;  
- Mapas e dashboards geográficos em tempo real.

**Em resumo:**
- Armazene coordenadas com `GEOADD`.  
- Busque entidades próximas com `GEOSEARCH`.  
- Calcule distâncias com `GEODIST`.  
- Combine com outras estruturas (Sets, Streams) para enriquecer o contexto geográfico.
