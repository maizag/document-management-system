import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentsApi';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState('');

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    setDocumentsError('');

    try {
      const documentsFromApi = await listDocuments();
      setDocuments(documentsFromApi);
    } catch (error) {
      setDocumentsError(error.message || 'Não foi possível carregar os documentos.');
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '900px' }}>
      <h1>Document Management System</h1>

      <UploadComponent onUploadSuccess={fetchDocuments} />

      <DocumentList
        documents={documents}
        isLoading={isLoadingDocuments}
        errorMessage={documentsError}
      />
    </main>
  );
}
