const documentosService = require('../services/documentos.service');

function mapErrorToHttpResponse(error, res) {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Erro interno do servidor.' : error.message;

  return res.status(statusCode).json({ error: message });
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
    const documents = documentosService.listDocuments();

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