import React, { useState } from 'react';
import axios from 'axios';
import './FileUpload.css'; // Importando o arquivo CSS

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    }
  };

  return (
    <div className="container">
      <h2 style = {{textAlign: "center"}}>Escolha o PDF de exemplo</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} style = {{display: "block", margin: "0 auto", marginBottom: "25x", marginTop: "25px"}}/>
        <button type="submit">Enviar</button>
      </form>
      
      {jsonResult && (
        <div className="json-result">
          <h3>Resultado em JSON</h3>
          <pre>{JSON.stringify(jsonResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
