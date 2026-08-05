# Especificação - Document Management System (DMS)

## 1. Objetivo

Entregar uma aplicação web para upload, listagem e download de documentos por usuário, com armazenamento de arquivos no filesystem local da aplicação e metadados mantidos em memória nesta fase inicial.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via formulário web
- Listagem de documentos com metadados essenciais
- Download de documentos por identificador
- Gestão simples por usuário (informado pelo cliente na requisição)
- Backend com Clean Architecture simples
- Frontend React consumindo backend via prefixo /api (proxy Vite)

### Fora do escopo

- Armazenamento externo (S3, GCS, Azure Blob etc.)
- Persistência de metadados em banco de dados
- Versionamento de documentos
- Autenticação/autorização completa (JWT, OAuth etc.)
- Edição de documentos já enviados
- Exclusão de documentos

## 3. Requisitos funcionais

| ID    | Requisito | Critério de aceite |
| ----- | --------- | ------------------ |
| RF-01 | O usuário pode enviar um documento. | Ao enviar multipart/form-data com arquivo válido, a API retorna 201 com metadados do documento criado. |
| RF-02 | O sistema deve associar o documento a um usuário. | O campo de usuário (owner) é obrigatório no upload e retornado no objeto de resposta. |
| RF-03 | O usuário pode listar documentos enviados. | A API retorna 200 com array de metadados; quando vazio, retorna array vazio. |
| RF-04 | O usuário pode filtrar listagem por proprietário. | Quando enviado owner em query string, a API retorna apenas documentos do usuário informado. |
| RF-05 | O usuário pode baixar documento pelo identificador. | Para ID existente, API responde 200 com arquivo binário e headers apropriados de download. |
| RF-06 | O sistema informa erro para documento inexistente no download. | Para ID inexistente, API retorna 404 com mensagem de erro padronizada. |
| RF-07 | O sistema valida requisições inválidas de upload. | Ausência de arquivo ou owner retorna 400 com detalhes do erro. |
| RF-08 | O sistema expõe endpoint de saúde da aplicação. | GET /health retorna 200 com { "status": "ok" }. |

## 4. Requisitos não funcionais

| ID     | Requisito | Detalhamento |
| ------ | --------- | ------------ |
| RNF-01 | Armazenamento local obrigatório | Upload usa multer com diskStorage, salvando arquivos em backend/storage. |
| RNF-02 | Metadados em memória | Repositório de metadados funciona em memória durante o ciclo de vida do processo Node.js. |
| RNF-03 | Configuração por ambiente | Porta e caminhos configuráveis por variáveis de ambiente, seguindo 12-Factor. |
| RNF-04 | Arquitetura em camadas | Fluxo obrigatório routes -> controllers -> services -> repositories. |
| RNF-05 | Tratamento de erros | Erros de validação e negócio devem retornar payload consistente em JSON. |
| RNF-06 | Simplicidade e legibilidade | Código orientado a KISS, DRY e responsabilidades únicas por função/camada. |
| RNF-07 | Compatibilidade com stack atual | Backend CommonJS com Express; frontend em React + Vite. |

## 5. Modelo de dados

### 5.1 Entidade de metadado de documento

| Campo        | Tipo   | Obrigatório | Exemplo | Descrição |
| ------------ | ------ | ----------- | ------- | --------- |
| id           | string | sim         | doc_01HX... | Identificador único do documento. |
| originalName | string | sim         | contrato.pdf | Nome original recebido no upload. |
| mimeType     | string | sim         | application/pdf | Tipo MIME reportado pelo arquivo. |
| size         | number | sim         | 24576 | Tamanho em bytes. |
| uploadedAt   | string | sim         | 2026-08-05T10:30:00.000Z | Data/hora do upload em ISO 8601. |
| owner        | string | sim         | user-123 | Identificador textual do usuário dono. |
| storageName  | string | sim         | 1722858900000-contrato.pdf | Nome interno do arquivo em disco. |
| storagePath  | string | sim         | backend/storage/1722...-contrato.pdf | Caminho local do arquivo armazenado. |

### 5.2 Regras de consistência

- id deve ser único para cada documento.
- owner não pode ser vazio.
- size deve ser maior que zero.
- storagePath deve apontar para arquivo existente no momento da persistência.

## 6. Contratos de API

### 6.1 Convenções gerais

- Base URL backend: http://localhost:3000
- No frontend (desenvolvimento), chamadas via /api/* com proxy Vite
- Content-Type de erros e respostas JSON: application/json
- Formato padrão de erro:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "owner é obrigatório",
    "details": []
  }
}
```

### 6.2 GET /health

Descrição: endpoint de verificação de saúde.

Resposta de sucesso (200):

```json
{
  "status": "ok"
}
```

### 6.3 POST /upload

Descrição: recebe um documento e cria seus metadados.

Request:

- Content-Type: multipart/form-data
- Campos:
  - file (binary, obrigatório)
  - owner (string, obrigatório)

Resposta de sucesso (201):

```json
{
  "id": "doc_01HXABCDEF",
  "originalName": "contrato.pdf",
  "mimeType": "application/pdf",
  "size": 24576,
  "uploadedAt": "2026-08-05T10:30:00.000Z",
  "owner": "user-123"
}
```

Erros:

- 400 quando file não for enviado
- 400 quando owner não for enviado
- 500 para falhas inesperadas de IO/processamento

### 6.4 GET /documents

Descrição: lista metadados de documentos.

Query params opcionais:

- owner (string): filtra por dono

Resposta de sucesso (200):

```json
[
  {
    "id": "doc_01HXABCDEF",
    "originalName": "contrato.pdf",
    "mimeType": "application/pdf",
    "size": 24576,
    "uploadedAt": "2026-08-05T10:30:00.000Z",
    "owner": "user-123"
  }
]
```

Erros:

- 500 para falhas inesperadas

### 6.5 GET /documents/:id/download

Descrição: faz download binário do arquivo pelo ID do documento.

Parâmetros de rota:

- id (string, obrigatório)

Resposta de sucesso (200):

- Body: stream/binário do arquivo
- Headers esperados:
  - Content-Type: tipo MIME do arquivo
  - Content-Disposition: attachment; filename="<originalName>"

Erros:

- 404 quando documento não existir
- 410 quando metadado existir mas arquivo físico não estiver disponível
- 500 para falhas inesperadas

## 7. Decisões arquiteturais

### 7.1 Backend (Clean Architecture simples)

Estrutura obrigatória em backend/src:

- routes/: definição de rotas Express e ligação de middlewares
- controllers/: tratamento HTTP (entrada, saída, status code, validações básicas)
- services/: regras de negócio (casos de uso)
- repositories/: persistência local (filesystem + metadados em memória)

Fluxo de dependência permitido:

- routes -> controllers -> services -> repositories

Restrições:

- Nenhuma camada interna deve depender de detalhes HTTP.
- Repositório encapsula acesso ao disco e estrutura de armazenamento dos metadados.

### 7.2 Persistência local com multer

- multer.diskStorage deve definir:
  - destino em backend/storage
  - nome interno único para evitar colisões
- O caminho físico final deve ser registrado no metadado (storagePath).
- Não usar provedores externos de upload/armazenamento.

### 7.3 Frontend

- Componentes React funcionais com Hooks.
- Serviço dedicado para chamadas HTTP (fetch) em frontend/src/services.
- Durante desenvolvimento, usar /api por proxy do Vite para evitar CORS manual.

## 8. Regras de validação e negócio

- Aceitar upload apenas quando file e owner forem enviados.
- Rejeitar owner em branco após trim().
- Em caso de falha para salvar metadados após upload físico, aplicar estratégia de compensação local (remoção do arquivo recém-gravado), quando possível.
- A listagem deve retornar somente campos de metadados públicos (não expor storagePath na API pública).

## 9. Observabilidade e operação

- Logs mínimos de servidor:
  - inicialização com porta ativa
  - sucesso e falha em upload/download
- Variáveis de ambiente sugeridas:
  - PORT (default 3000)
  - STORAGE_DIR (default backend/storage)
  - MAX_FILE_SIZE_MB (opcional para limitar uploads)

## 10. Estratégia de testes

- Backend com node:test:
  - teste de saúde (GET /health)
  - teste de upload válido e inválido
  - teste de listagem (com e sem filtro)
  - teste de download existente/inexistente
- Testes devem cobrir ao menos caminhos de sucesso e erros de validação.

## 11. Plano de execução em etapas

1. Definir contratos e estrutura das camadas  
Objetivo: criar esqueleto de routes, controllers, services, repositories com responsabilidades claras.  
Saída: módulos exportados e integrados no app.js.

2. Implementar persistência local de arquivos  
Objetivo: configurar multer.diskStorage apontando para backend/storage e nomenclatura única.  
Saída: middleware de upload funcional.

3. Implementar repositório de metadados em memória  
Objetivo: criar operações de criar, listar, buscar por ID e filtrar por owner.  
Saída: contrato de repositório estável para consumo dos serviços.

4. Implementar serviços de negócio  
Objetivo: encapsular regras de validação, criação de metadados e recuperação para download.  
Saída: casos de uso sem dependência de HTTP.

5. Implementar controllers e rotas  
Objetivo: expor POST /upload, GET /documents, GET /documents/:id/download e mapear erros para status HTTP.  
Saída: API completa conforme seção 6.

6. Implementar tratamento padronizado de erros  
Objetivo: unificar payload de erro e códigos de resposta para validação, não encontrado e falhas internas.  
Saída: middleware/estratégia consistente de erro.

7. Implementar frontend (upload, lista, download)  
Objetivo: construir componentes e serviço HTTP para consumir API via /api.  
Saída: fluxo ponta a ponta no navegador.

8. Cobrir cenários com testes automatizados  
Objetivo: adicionar testes backend com node:test cobrindo principais fluxos e falhas.  
Saída: suíte mínima de regressão confiável.

9. Validação final e documentação de uso  
Objetivo: validar execução local (backend e frontend) e registrar exemplos de uso da API.  
Saída: sistema executável e especificação alinhada à implementação.

## 12. Critérios de pronto

- Endpoints previstos implementados e testados.
- Upload gravando fisicamente em backend/storage via multer.
- Metadados exclusivamente em memória na fase atual.
- Fluxo frontend funcionando com proxy /api.
- Erros padronizados e documentação coerente com comportamento real.
