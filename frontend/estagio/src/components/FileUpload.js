import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setJsonResult(response.data);
    } catch (error) {
      console.error('Error uploading file: ', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h2 style = {{textAlign: "center"}}>Upload de Arquivo PDF</h2>
      <form onSubmit={handleSubmit}>
        <div className="file-input-container">
          <input type="file" onChange={handleFileChange} />
        </div>
        <div>
        <button type="submit" disabled={uploading} style = {{justifyItems:"center"}}>
            {uploading ? 'Enviando...' : 'Enviar'}
        </button>
        </div>
      </form>

      {jsonResult && (
        <div className="json-result-container">
          <h3>Resultado em JSON</h3>
          <pre>{JSON.stringify(jsonResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
