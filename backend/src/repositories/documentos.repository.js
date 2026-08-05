const crypto = require('crypto');

const documentsMetadata = [];

function saveMetadata({
  originalName,
  storageFileName,
  size,
  uploadDate,
  owner,
}) {
  const metadata = {
    id: crypto.randomUUID(),
    originalName,
    storageFileName,
    size,
    uploadDate,
    owner,
  };

  documentsMetadata.push(metadata);

  return metadata;
}

function listMetadata() {
  return [...documentsMetadata];
}

function findMetadataById(documentId) {
  return documentsMetadata.find((document) => document.id === documentId) || null;
}

module.exports = {
  saveMetadata,
  listMetadata,
  findMetadataById,
};