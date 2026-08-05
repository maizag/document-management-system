const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const documentsMetadata = [];
const storageDirectory = path.resolve(__dirname, '../../storage');

function createRepositoryError(message, statusCode = 500, code = 'REPOSITORY_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function saveMetadata({
  originalName,
  storageFileName,
  mimeType,
  size,
  uploadDate,
  owner,
}) {
  const metadata = {
    id: crypto.randomUUID(),
    originalName,
    storageFileName,
    mimeType,
    size,
    uploadDate,
    owner,
  };

  documentsMetadata.push(metadata);

  return metadata;
}

function listMetadata({ owner } = {}) {
  if (!owner) {
    return [...documentsMetadata];
  }

  return documentsMetadata.filter((document) => document.owner === owner);
}

function findMetadataById(documentId) {
  return documentsMetadata.find((document) => document.id === documentId) || null;
}

function resolveStorageFilePath(storageFileName) {
  const safeStorageFileName = String(storageFileName || '').trim();

  if (!safeStorageFileName) {
    throw createRepositoryError('Nome de arquivo do storage inválido.', 500, 'INTERNAL_ERROR');
  }

  if (path.basename(safeStorageFileName) !== safeStorageFileName) {
    throw createRepositoryError('Nome de arquivo inválido para download.', 400, 'VALIDATION_ERROR');
  }

  const resolvedFilePath = path.resolve(storageDirectory, safeStorageFileName);
  const relativePath = path.relative(storageDirectory, resolvedFilePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw createRepositoryError('Tentativa de acesso fora do storage.', 400, 'VALIDATION_ERROR');
  }

  return resolvedFilePath;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function clearMetadata() {
  documentsMetadata.length = 0;
}

module.exports = {
  saveMetadata,
  listMetadata,
  findMetadataById,
  resolveStorageFilePath,
  fileExists,
  clearMetadata,
};