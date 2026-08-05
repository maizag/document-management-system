const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const documentosController = require('../controllers/documentos.controller');

const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const defaultMaxFileSizeMb = 10;
const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB || defaultMaxFileSizeMb);
const maxFileSizeBytes = Number.isFinite(maxFileSizeMb) && maxFileSizeMb > 0
  ? Math.floor(maxFileSizeMb * 1024 * 1024)
  : defaultMaxFileSizeMb * 1024 * 1024;
const allowedMimeTypes = (process.env.ALLOWED_UPLOAD_MIME_TYPES || '')
  .split(',')
  .map((mimeType) => mimeType.trim())
  .filter(Boolean);

function createUploadValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  return error;
}

function sanitizeOriginalName(originalName) {
  const fileName = path.basename(String(originalName || '')).trim();

  if (!fileName) {
    return 'document';
  }

  return fileName.replace(/[\u0000-\u001F\u007F]/g, '');
}

function buildStorageFileName(originalName) {
  const safeOriginalName = sanitizeOriginalName(originalName);
  const extension = path.extname(safeOriginalName).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 16);
  return `${crypto.randomUUID()}${extension}`;
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, storageDirectory);
  },
  filename(req, file, callback) {
    callback(null, buildStorageFileName(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
  },
  fileFilter(req, file, callback) {
    if (allowedMimeTypes.length === 0) {
      callback(null, true);
      return;
    }

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(createUploadValidationError('Tipo de arquivo não permitido.'));
  },
});
const router = express.Router();

router.post('/upload', upload.single('document'), documentosController.uploadDocument);
router.get('/documents', documentosController.listDocuments);
router.get('/documents/:id/download', documentosController.downloadDocument);

module.exports = router;