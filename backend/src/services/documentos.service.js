const documentosRepository = require('../repositories/documentos.repository');

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;

  return error;
}

function sanitizeOwner(owner) {
  return String(owner || '').trim();
}

function sanitizeOriginalName(originalName) {
  const safeName = String(originalName || '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return safeName || 'documento';
}

function sanitizeDownloadName(originalName) {
  return sanitizeOriginalName(originalName).replace(/[\r\n"]/g, '_');
}

function createDocument({ file, owner }) {
  if (!file) {
    const error = createServiceError('Arquivo não enviado.', 400);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const sanitizedOwner = sanitizeOwner(owner);

  if (!sanitizedOwner) {
    const error = createServiceError('owner é obrigatório.', 400);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return documentosRepository.saveMetadata({
    originalName: sanitizeOriginalName(file.originalname),
    storageFileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    uploadDate: new Date().toISOString(),
    owner: sanitizedOwner,
  });
}

function listDocuments({ owner } = {}) {
  const sanitizedOwner = sanitizeOwner(owner);
  return documentosRepository.listMetadata({ owner: sanitizedOwner || null });
}

async function getDocumentForDownload(documentId) {
  if (!documentId) {
    const error = createServiceError('ID do documento é obrigatório.', 400);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const metadata = documentosRepository.findMetadataById(documentId);

  if (!metadata) {
    const error = createServiceError('Documento não encontrado.', 404);
    error.code = 'NOT_FOUND';
    throw error;
  }

  const filePath = documentosRepository.resolveStorageFilePath(metadata.storageFileName);
  const fileExists = await documentosRepository.fileExists(filePath);

  if (!fileExists) {
    const error = createServiceError('Arquivo do documento não encontrado no storage.', 410);
    error.code = 'GONE';
    throw error;
  }

  return {
    filePath,
    downloadName: sanitizeDownloadName(metadata.originalName),
  };
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};