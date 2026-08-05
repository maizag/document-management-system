const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const documentosController = require('../controllers/documentos.controller');

const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, storageDirectory);
  },
  filename(req, file, callback) {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniquePrefix}-${file.originalname}`);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post('/upload', upload.single('document'), documentosController.uploadDocument);
router.get('/documents', documentosController.listDocuments);
router.get('/documents/:id/download', documentosController.downloadDocument);

module.exports = router;