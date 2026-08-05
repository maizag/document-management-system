const documentosService = require('../services/documentos.service');

function getDefaultErrorCode(statusCode) {
  if (statusCode >= 500) {
    return 'INTERNAL_ERROR';
  }

  if (statusCode === 404) {
    return 'NOT_FOUND';
  }

  if (statusCode === 410) {
    return 'GONE';
  }

  return 'VALIDATION_ERROR';
}

function mapErrorToHttpResponse(error, res) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno do servidor.' : error.message;
  const code = error.code || getDefaultErrorCode(statusCode);

  return res.status(statusCode).json({
    error: {
      code,
      message,
      details: [],
    },
  });
}

function uploadDocument(req, res) {
  try {
    const document = documentosService.createDocument({
      file: req.file,
      owner: req.body?.owner,
    });

    return res.status(201).json(document);
  } catch (error) {
    return mapErrorToHttpResponse(error, res);
  }
}

function listDocuments(req, res) {
  try {
    const documents = documentosService.listDocuments({ owner: req.query?.owner });

    return res.json(documents);
  } catch (error) {
    return mapErrorToHttpResponse(error, res);
  }
}

async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const download = await documentosService.getDocumentForDownload(id);

    return res.download(download.filePath, download.downloadName);
  } catch (error) {
    return mapErrorToHttpResponse(error, res);
  }
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};