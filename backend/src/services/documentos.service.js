const path = require('path');
const fs = require('fs/promises');

const documentosRepository = require('../repositories/documentos.repository');

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function createDocument({ file, owner }) {
  if (!file) {
    throw createServiceError('Arquivo não enviado.', 400);
  }

  const sanitizedOwner = owner ? String(owner).trim() : 'anonymous';

  return documentosRepository.saveMetadata({
    originalName: file.originalname,
    storageFileName: file.filename,
    size: file.size,
    uploadDate: new Date().toISOString(),
    owner: sanitizedOwner || 'anonymous',
  });
}

function listDocuments() {
  return documentosRepository.listMetadata();
}

async function getDocumentForDownload(documentId) {
  if (!documentId) {
    throw createServiceError('ID do documento é obrigatório.', 400);
  }

  const metadata = documentosRepository.findMetadataById(documentId);

  if (!metadata) {
    throw createServiceError('Documento não encontrado.', 404);
  }

  const filePath = path.resolve(__dirname, '../../storage', metadata.storageFileName);

  try {
    await fs.access(filePath);
  } catch {
    throw createServiceError('Arquivo do documento não encontrado no storage.', 404);
  }

  return {
    filePath,
    downloadName: metadata.originalName,
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};