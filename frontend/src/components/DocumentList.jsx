import DownloadButton from './DownloadButton';

function formatFileSize(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) {
    return '-';
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const sizeInKb = size / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, errorMessage }) {
  return (
    <section>
      <h2>Documentos</h2>

      {isLoading ? <p>Carregando documentos...</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      {!isLoading && !errorMessage && documents.length === 0 ? (
        <p>Nenhum documento enviado ainda.</p>
      ) : null}

      {!isLoading && documents.length > 0 ? (
        <ul>
          {documents.map((documentItem) => (
            <li key={documentItem.id}>
              <p>
                <strong>{documentItem.originalName}</strong>
              </p>
              <p>Dono: {documentItem.owner}</p>
              <p>Tamanho: {formatFileSize(documentItem.size)}</p>
              <p>Enviado em: {new Date(documentItem.uploadDate).toLocaleString('pt-BR')}</p>
              <DownloadButton documentItem={documentItem} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
