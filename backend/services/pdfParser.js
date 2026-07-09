const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from binary buffer based on file mimetype.
 * Supports PDF, DOCX, and TXT files.
 */
const extractText = async (buffer, mimeType) => {
  if (!buffer) return '';

  const mime = String(mimeType || '').toLowerCase();

  try {
    if (mime.includes('pdf')) {
      console.log('[PARSER] Extracting text from PDF file...');
      const data = await pdf(buffer);
      return data.text || '';
    } else if (mime.includes('word') || mime.includes('officedocument') || mime.includes('docx')) {
      console.log('[PARSER] Extracting text from Word DOCX file...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } else {
      // Treat as plain text fallback
      console.log('[PARSER] Treating file as plain text...');
      return buffer.toString('utf8');
    }
  } catch (error) {
    console.error('[PARSER ERROR] Error extracting text from file:', error.message);
    throw new Error('Failed to parse document text content. Ensure file format is valid.');
  }
};

module.exports = {
  extractText
};
