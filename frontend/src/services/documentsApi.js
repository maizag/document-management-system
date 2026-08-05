const API_PREFIX = '/api';

async function buildRequestError(response) {
  let message = 'Falha na comunicação com a API.';

  try {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await response.json();
      message = body.error || body.message || message;
    } else {
      const bodyText = await response.text();
      if (bodyText) {
        message = bodyText;
      }
    }
  } catch {
    // Mantém a mensagem padrão quando a resposta não pode ser lida.
  }

  const error = new Error(message);
  error.status = response.status;
  return error;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_PREFIX}${path}`, options);

  if (!response.ok) {
    throw await buildRequestError(response);
  }

  return response.json();
}

export async function listDocuments() {
  return requestJson('/documents');
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('document', file);

  if (owner && owner.trim()) {
    formData.append('owner', owner.trim());
  }

  return requestJson('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function downloadDocument({ id, fileName }) {
  const response = await fetch(`${API_PREFIX}/documents/${id}/download`);

  if (!response.ok) {
    throw await buildRequestError(response);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || `document-${id}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
