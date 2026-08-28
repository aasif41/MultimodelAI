import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://multimodelai.onrender.com',
});

/**
 * Sends a text-only chat sequence to the backend.
 * @param {Array} messages - Chat history array of objects {role, content}
 * @returns {Object} response - The generated text
 */
export async function askChat(messages) {
  try {
    const response = await api.post('/api/chat', { messages });
    return {
      answer: response.data.answer,
      updatedMessages: response.data.updatedMessages
    };
  } catch (error) {
    console.error("Chat API Error", error);
    throw error.response?.data?.error || 'Failed to get answer from AI.';
  }
}

/**
 * Uploads an image to the backend and asks a question about it.
 * @param {File} mediaFile - Image file
 * @param {String} question - The query about the image
 * @returns {Object} response - The generated text answer
 */
export async function uploadImageAndAsk(mediaFile, question = '') {
  try {
    const formData = new FormData();
    formData.append('media', mediaFile);
    formData.append('question', question);
    
    const response = await api.post('/api/chat/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      answer: response.data.answer,
    };
  } catch (error) {
    console.error("Image API Error", error);
    throw error.response?.data?.error || 'Failed to analyze image.';
  }
}
