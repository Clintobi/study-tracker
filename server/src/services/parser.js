const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const path = require('path');

async function parseFile(buffer, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === '.pptx' || ext === '.ppt') {
    return new Promise((resolve, reject) => {
      officeParser.parseOfficeAsync(buffer, { outputErrorToConsole: false })
        .then(resolve)
        .catch(reject);
    });
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { parseFile };
