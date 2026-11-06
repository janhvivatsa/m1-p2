const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');

/**
 * Parses uploaded file buffer (TXT, PDF, DOCX) and returns plain text.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} originalname - Original file name with extension
 * @returns {Promise<string>} - Extracted text content
 */
async function parseUploadedFile(buffer, originalname) {
  const ext = path.extname(originalname || '').toLowerCase();

  if (ext === '.txt') {
    return buffer.toString('utf-8');
  }

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  throw new Error(`Unsupported file type '${ext}'. Please upload a .txt, .pdf, or .docx file.`);
}

module.exports = {
  parseUploadedFile
};
