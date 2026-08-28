const axios = require('axios');
const fs = require('fs');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Vision model: supports images
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
// Text model: fast text-only chat
const GROQ_TEXT_MODEL = 'llama-3.1-8b-instant';

/**
 * Handles text-based chat using Groq API
 * @param {Array} messages - Chat history array [{role, content}]
 * @returns {String} AI response text
 */
async function chatWithAI(messages) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful, intelligent multi-modal assistant. Format your answers smartly using Markdown.',
          },
          ...messages,
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in Groq chat API:', error.response?.data || error.message);
    throw new Error('Failed to get response from Groq AI.');
  }
}

/**
 * Analyzes an image using Groq vision model (llama-4-scout).
 * Auto-detects recipe requests: identifies the dish first, then generates a full recipe.
 * @param {String} imagePath - Absolute path to the uploaded image file
 * @param {String} question  - The user's question / prompt
 * @returns {String} AI answer
 */
async function askImage(imagePath, question, mimeType) {
  try {
    return await callGroqVision(imagePath, question, mimeType, GROQ_VISION_MODEL);
  } catch (error) {
    console.warn(`Primary vision model (${GROQ_VISION_MODEL}) failed. Retrying with fallback model (qwen/qwen3.6-27b)... Error details:`, error.message);
    try {
      return await callGroqVision(imagePath, question, mimeType, 'qwen/qwen3.6-27b');
    } catch (fallbackError) {
      console.error('Fallback vision model also failed:', fallbackError.message);
      const errMsg = fallbackError.response?.data?.error?.message || fallbackError.message || 'Unknown error';
      throw new Error(`Failed to process image: ${errMsg}`);
    }
  }
}

async function callGroqVision(imagePath, question, mimeType, modelName) {
  const imageBuffer = fs.readFileSync(imagePath);
  if (!mimeType) {
    const ext = imagePath.split('.').pop().toLowerCase();
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'gif') mimeType = 'image/gif';
    else mimeType = 'image/jpeg';
  }
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const userQuestion = question?.trim() || 'What is in this image? Describe it in detail.';
  const isRecipeRequest = /recipe|ingredients|how to (cook|make|prepare)/i.test(userQuestion);

  let systemPrompt =
    'You are a helpful, intelligent visual assistant. Analyze images carefully and answer questions accurately. Format responses using Markdown.';

  let userContent;

  if (isRecipeRequest) {
    userContent = [
      {
        type: 'text',
        text: `Look at this food image. First identify the dish by name, then provide a complete recipe including:
- Dish name
- Ingredients list with quantities
- Step-by-step cooking instructions
- Estimated cooking time and servings

User's request: "${userQuestion}"`,
      },
      {
        type: 'image_url',
        image_url: { url: dataUrl },
      },
    ];
  } else {
    userContent = [
      { type: 'text', text: userQuestion },
      { type: 'image_url', image_url: { url: dataUrl } },
    ];
  }

  console.log(`Sending image to Groq vision model (${modelName})...`);
  const response = await axios.post(
    GROQ_API_URL,
    {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1500,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = {
  chatWithAI,
  askImage,
};
