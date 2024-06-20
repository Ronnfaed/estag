const express = require('express');
const multer = require('multer');
const pdf2json = require('pdf2json');
const fs = require('fs');
const path = require('path');
const { configDotenv } = require('dotenv');

const app = express();
const upload = multer({ dest: 'uploads/' });

function getSmallestY(data) {
  // Initialize the smallest y with a large number
  let smallestY = Infinity;
  
  // Extract the fills and texts
  let fills = data.Pages[0].Fills;
  let texts = data.Pages[0].Texts;
  
  // Check each fill's y value
  fills.forEach(fill => {
      if (fill.y < smallestY) {
          smallestY = fill.y;
      }
  });
  
  // Check each text's y value
  texts.forEach(text => {
      if (text.y < smallestY) {
          smallestY = text.y;
      }
  });
  
  return smallestY;
}

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
  let groupedData = [];
  pdfParser.on('pdfParser_dataReady', pdfData => {
    // Process pdfData as needed
    // For example, filter or manipulate the data
    fs.unlinkSync(pdfFilePath); // Delete the uploaded file after processing

    const firstRowCoordinate = getSmallestY(pdfData); //pega primeira row (Fills são os retangulos do pdf2json)
    pdfData.Pages.map((page) => {
      const texts = page.Texts.filter((text) => text.y != firstRowCoordinate); //ignora a primeira row
      texts.map((text) => {
        const writtenText = text.R[0].T;
        const yCoordinate = text.y;
        //remove todos espacos, se tiver algum caracter alem de espaco ele leva em consideracao
        //agrupa por yCoordinate
        if(writtenText.replace(/%20/g, '').length > 0) {
          const text = decodeURIComponent(writtenText);
          const indexGroup = groupedData.findIndex((group) => group.yCoordinate === yCoordinate);
          if(indexGroup != -1) {
            const numberTexts = groupedData[indexGroup].texts.length;
            //se tiver mais de 3 textos na mesma linha, concatena o texto com o ultimo
            if(numberTexts > 2) {
              groupedData[indexGroup].texts[numberTexts - 1] = `${groupedData[indexGroup].texts[numberTexts - 1]}${text}`;
            } else {
              groupedData[indexGroup].texts.push(text);
            }
          } else {
            groupedData.push({
              yCoordinate,
              texts: [text]
            });
          }
        }
      })
    })
    res.json(groupedData);
  });
});
configDotenv();
const PORT = process.env.APP_PORT || 5000;
console.log(PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
