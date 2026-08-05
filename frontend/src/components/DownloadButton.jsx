import { useState } from 'react';
import { downloadDocument } from '../services/documentsApi';

export default function DownloadButton({ documentItem }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleDownload() {
    setIsDownloading(true);
    setErrorMessage('');

    try {
      await downloadDocument({
        id: documentItem.id,
        fileName: documentItem.originalName,
      });
    } catch (error) {
      setErrorMessage(error.message || 'Falha no download do documento.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Download'}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </div>
  );
}
