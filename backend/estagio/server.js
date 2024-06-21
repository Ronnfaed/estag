const express = require('express');
const multer = require('multer');
const pdf2json = require('pdf2json');
const fs = require('fs');
const path = require('path');
const { configDotenv } = require('dotenv');

const app = express();
const upload = multer({ dest: 'uploads/' });

function getSmallestY(data) {
  // Inicializa o menor valor do eixo Y com um numero infinito.
  let smallestY = Infinity;
  
  // Extração de todos os texts e as demais informações
  let fills = data.Pages[0].Fills;
  let texts = data.Pages[0].Texts;
  
  // Verifica o valor posicional de cada fill, sempre em relação ao eixo y.
  fills.forEach(fill => {
      if (fill.y < smallestY) {
          smallestY = fill.y;
      }
  });
  
  // Verifica o valor posicional de cada texto, baseado no eixo y.
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
  // Utilização do pdf2json para processar o PDF
  const pdfParser = new pdf2json();
  pdfParser.loadPDF(pdfFilePath);

  pdfParser.on('pdfParser_dataError', errData =>
    res.status(500).json({ error: 'An error occurred while processing PDF' })
  );
  let groupedData = [];
  pdfParser.on('pdfParser_dataReady', pdfData => {
    // Processar os dados do PDF de acordo com a necessidade.
    // No caso, para filtrar e manipular os dados.
    fs.unlinkSync(pdfFilePath); // Deleta o PDF logo após o processamento.

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
            //se der ruim apaga daqui
            if(groupedData[indexGroup].texts[numberTexts - 1].slice(-1) == '/') {
              groupedData[indexGroup].texts[numberTexts - 1] = `${groupedData[indexGroup].texts[numberTexts - 1]}${text}`;
            } else if(['mg', 'fL'].some((notToSkipVariable) => notToSkipVariable == text)) {
              groupedData[indexGroup].texts[numberTexts - 1] = `${groupedData[indexGroup].texts[numberTexts - 1]}${text}`;
            } else if(['/', 'f', 'L'].includes(text[0])) {  
              groupedData[indexGroup].texts[numberTexts - 1] = `${groupedData[indexGroup].texts[numberTexts - 1]}${text}`;
              //ate aqui
            } else if(numberTexts > 2) {
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
    // Remove a menção da coordenada do eixo Y do texto extraído, e formata os dados coletados atribuindo a eles um prefixo de identificação.
    const finalOutput = groupedData.map(group => {
      const [exame, valor, ref] = group.texts;
      return {
        texts: [
          `Exame: ${exame}`,
          `Valor: ${valor}`,
          `Ref: ${ref}`
        ]
      };
    });
    res.json(finalOutput);
  });
});
configDotenv();
const PORT = process.env.APP_PORT || 5000;
console.log(PORT);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
