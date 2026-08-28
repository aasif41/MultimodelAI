const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { chatWithAI, askImage } = require('../services/aiService');
const fs = require('fs');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    let { messages } = req.body;
    
    // Messages might be sent as stringified JSON
    if (typeof messages === 'string') {
      messages = JSON.parse(messages);
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Since we now separate image endpoints, this endpoint only handles text
    // Call Groq / llama3-8b-8192
    
    console.log('Sending context to Groq API...');
    const answer = await chatWithAI(messages);

    res.json({ answer, updatedMessages: messages });
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: error.message || 'Error processing chat request' });
  }
});

// POST /api/chat/image
router.post('/image', upload.single('media'), async (req, res) => {
  try {
    let { question } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    if (!req.file.mimetype.startsWith('image')) {
      return res.status(400).json({ error: 'Uploaded file must be an image' });
    }

    console.log(`Processing image: ${req.file.filename} with question: ${question}`);
    const answer = await askImage(req.file.path, question, req.file.mimetype);

    // Optionally cleanup file after processing if you don't want to store uploads forever
    // fs.unlinkSync(req.file.path);

    res.json({ answer });
  } catch (error) {
    console.error('Error in image API:', error);
    res.status(500).json({ error: error.message || 'Error processing image request' });
  }
});

module.exports = router;
