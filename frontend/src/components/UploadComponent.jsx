import { useState } from 'react';
import { uploadDocument } from '../services/documentsApi';

export default function UploadComponent({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setErrorMessage('Selecione um arquivo para enviar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const uploadedDocument = await uploadDocument({
        file: selectedFile,
        owner,
      });

      setSelectedFile(null);
      setOwner('');
      event.currentTarget.reset();

      if (onUploadSuccess) {
        onUploadSuccess(uploadedDocument);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Não foi possível enviar o documento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Upload de documento</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="document-file">Arquivo</label>
          <input
            id="document-file"
            name="document"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setSelectedFile(file);
              setErrorMessage('');
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="document-owner">Dono (opcional)</label>
          <input
            id="document-owner"
            name="owner"
            type="text"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Ex.: maria"
          />
        </div>

        <button type="submit" disabled={isSubmitting || !selectedFile}>
          {isSubmitting ? 'Enviando...' : 'Enviar documento'}
        </button>
      </form>

      {errorMessage ? <p>{errorMessage}</p> : null}
    </section>
  );
}
