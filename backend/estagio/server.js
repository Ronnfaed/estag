const express = require('express');
const multer = require('multer');
const pdf2json = require('pdf2json');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const pdfFilePath = req.file.path;

  // Use pdf2json to process the PDF file
  const pdfParser = new pdf2json();
  pdfParser.loadPDF(pdfFilePath);

  pdfParser.on('pdfParser_dataError', errData =>
    res.status(500).json({ error: 'An error occurred while processing PDF' })
  );

  pdfParser.on('pdfParser_dataReady', pdfData => {
    // Process pdfData as needed
    // For example, filter or manipulate the data
    fs.unlinkSync(pdfFilePath); // Delete the uploaded file after processing

    res.json(pdfData);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
