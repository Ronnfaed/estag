import React from 'react';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ textAlign: "center" }}>PDF → JSON</h1>
      </header>
      <main>
        <FileUpload />
      </main>
    </div>
  );
}

export default App;
