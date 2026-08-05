const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs/promises');
const path = require('path');
const app = require('../src/app');
const documentosRepository = require('../src/repositories/documentos.repository');

const storageDirectory = path.resolve(__dirname, '../storage');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

beforeEach(() => {
  documentosRepository.clearMetadata();
});

after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

async function uploadFixture({ owner = 'maria', fileName = 'arquivo.txt', content = 'conteudo de teste' } = {}) {
  const formData = new FormData();
  formData.append('document', new Blob([content], { type: 'text/plain' }), fileName);

  if (owner !== undefined) {
    formData.append('owner', owner);
  }

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /health retorna status ok', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { status: 'ok' });
});

test('POST /upload retorna 400 quando arquivo não é enviado', async () => {
  const formData = new FormData();
  formData.append('owner', 'maria');

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
});

test('POST /upload retorna 400 quando owner é vazio', async () => {
  const { response, body } = await uploadFixture({ owner: '   ' });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  assert.strictEqual(body.error.message, 'owner é obrigatório.');
});

test('POST /upload salva documento com nome seguro no storage', async () => {
  const { response, body } = await uploadFixture({
    owner: 'ana',
    fileName: '../tentativa-traversal.txt',
  });

  assert.strictEqual(response.status, 201);
  assert.ok(body.id);
  assert.ok(body.storageFileName);
  assert.strictEqual(body.owner, 'ana');
  assert.strictEqual(body.storageFileName.includes('..'), false);
  assert.strictEqual(body.storageFileName.includes('/'), false);

  await fs.unlink(path.resolve(storageDirectory, body.storageFileName));
});

test('GET /documents suporta filtro por owner', async () => {
  const uploadA = await uploadFixture({ owner: 'alice', fileName: 'a.txt', content: 'A' });
  const uploadB = await uploadFixture({ owner: 'bob', fileName: 'b.txt', content: 'B' });

  assert.strictEqual(uploadA.response.status, 201);
  assert.strictEqual(uploadB.response.status, 201);

  const filteredResponse = await fetch(`${baseUrl}/documents?owner=alice`);
  const filteredBody = await filteredResponse.json();

  assert.strictEqual(filteredResponse.status, 200);
  assert.strictEqual(filteredBody.length, 1);
  assert.strictEqual(filteredBody[0].owner, 'alice');

  await fs.unlink(path.resolve(storageDirectory, uploadA.body.storageFileName));
  await fs.unlink(path.resolve(storageDirectory, uploadB.body.storageFileName));
});

test('GET /documents/:id/download retorna 404 para id inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/id-inexistente/download`);
  const body = await response.json();

  assert.strictEqual(response.status, 404);
  assert.strictEqual(body.error.code, 'NOT_FOUND');
});

test('GET /documents/:id/download retorna 410 quando arquivo não existe mais', async () => {
  const { response: uploadResponse, body: uploadBody } = await uploadFixture({
    owner: 'julia',
    fileName: 'arquivo-para-remover.txt',
  });

  assert.strictEqual(uploadResponse.status, 201);

  const storedFilePath = path.resolve(storageDirectory, uploadBody.storageFileName);
  await fs.unlink(storedFilePath);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadBody.id}/download`);
  const downloadBody = await downloadResponse.json();

  assert.strictEqual(downloadResponse.status, 410);
  assert.strictEqual(downloadBody.error.code, 'GONE');
});
