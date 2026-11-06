const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const { analyzeMeeting } = require('./gemini');
const { parseUploadedFile } = require('./fileParser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer for in-memory file handling (up to 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------------------------------------------------------------------------
// API ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * Health check endpoint: reports backend status and Gemini API key availability
 */
app.get('/api/health', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  const hasGeminiKey = Boolean(apiKey && !apiKey.includes('YOUR_GEMINI_API_KEY'));

  res.json({
    status: 'ok',
    service: 'AI-Powered Meeting-to-Action Assistant',
    hasGeminiKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * File upload parsing endpoint: handles TXT, PDF, DOCX file uploads
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file was uploaded.' });
    }

    const originalname = req.file.originalname;
    const buffer = req.file.buffer;

    console.log(`[Upload] Processing uploaded file: ${originalname} (${req.file.size} bytes)`);
    const extractedText = await parseUploadedFile(buffer, originalname);

    if (!extractedText || !extractedText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'The uploaded document contains no extractable text.'
      });
    }

    const wordCount = extractedText.trim().split(/\s+/).length;

    res.json({
      success: true,
      filename: originalname,
      text: extractedText,
      wordCount
    });
  } catch (error) {
    console.error('[Upload Error]', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse the uploaded file.'
    });
  }
});

/**
 * Analysis endpoint: receives transcript and extracts summary, decisions, action items, and ambiguities
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { title, date, participants, transcript } = req.body;

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Meeting transcript is required. Please provide a transcript to analyze.'
      });
    }

    if (transcript.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'The transcript is too short. Please provide a more complete meeting discussion.'
      });
    }

    console.log(`[Analyze] Analyzing meeting "${title || 'Untitled'}" (${transcript.length} characters)...`);

    const analysisResult = await analyzeMeeting({
      title: (title || '').trim(),
      date: (date || '').trim(),
      participants: (participants || '').trim(),
      transcript: transcript.trim()
    });

    res.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('[Analyze Error]', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during meeting analysis.'
    });
  }
});

// Fallback to index.html for any unhandled GET routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Prevent unexpected shutdown and log errors
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Meeting-to-Action Assistant running at:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

// Keep process active
setInterval(() => {}, 60000);
