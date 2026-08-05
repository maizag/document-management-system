const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const app = require('../src/app');

beforeEach(async () => {
  await fetch('http://127.0.0.1:3000/documents', { method: 'DELETE' });
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('GET /documents retorna lista de documentos', async () => {
  const response = await fetch('http://127.0.0.1:3000/documents');

  assert.strictEqual(response.status, 200);

  const payload = await response.json();

  assert.ok(Array.isArray(payload.documents));
  assert.strictEqual(payload.documents.length, 0);
});

test('POST /upload salva arquivo e GET /documents lista metadados', async () => {
  const tempFilePath = path.join(os.tmpdir(), `dms-upload-${Date.now()}.txt`);
  await fs.writeFile(tempFilePath, 'conteudo de teste', 'utf8');

  const form = new FormData();
  const fileBuffer = await fs.readFile(tempFilePath);
  const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
  form.append('document', fileBlob, 'arquivo-teste.txt');

  const uploadResponse = await fetch('http://127.0.0.1:3000/upload', {
    method: 'POST',
    body: form,
  });

  assert.strictEqual(uploadResponse.status, 201);

  const uploadPayload = await uploadResponse.json();
  assert.ok(uploadPayload.id);

  const listResponse = await fetch('http://127.0.0.1:3000/documents');
  assert.strictEqual(listResponse.status, 200);

  const listPayload = await listResponse.json();
  assert.strictEqual(listPayload.documents.length, 1);
  assert.strictEqual(listPayload.documents[0].id, uploadPayload.id);
  assert.strictEqual(listPayload.documents[0].originalName, 'arquivo-teste.txt');
});

test('GET /documents/:id/download baixa o arquivo enviado', async () => {
  const tempFilePath = path.join(os.tmpdir(), `dms-download-${Date.now()}.txt`);
  await fs.writeFile(tempFilePath, 'download content', 'utf8');

  const form = new FormData();
  const fileBuffer = await fs.readFile(tempFilePath);
  const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
  form.append('document', fileBlob, 'download-teste.txt');

  const uploadResponse = await fetch('http://127.0.0.1:3000/upload', {
    method: 'POST',
    body: form,
  });
  const uploadPayload = await uploadResponse.json();

  const downloadResponse = await fetch(
    `http://127.0.0.1:3000/documents/${uploadPayload.id}/download`
  );

  assert.strictEqual(downloadResponse.status, 200);

  const contentDisposition = downloadResponse.headers.get('content-disposition') || '';
  assert.match(contentDisposition, /download-teste\.txt/);

  const downloadedText = await downloadResponse.text();
  assert.strictEqual(downloadedText, 'download content');
});
