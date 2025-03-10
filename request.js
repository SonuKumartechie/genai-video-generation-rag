const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;

// Initialize OpenAI with your API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware to parse JSON requests
app.use(express.json());

// Load knowledge base (example: a simple JSON file)
const knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge-base.json'), 'utf8'));

// Function to retrieve relevant info from knowledge base
function retrieveRelevantData(query) {
  return knowledgeBase.find(entry => query.toLowerCase().includes(entry.keyword.toLowerCase()))?.data || 'No relevant data found.';
}

// Route to generate AI video with RAG
app.post('/generate-video', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Retrieve relevant data
  const relevantData = retrieveRelevantData(prompt);

  try {
    const completion = await openai.images.generate({
      model: 'dall-e-2',
      prompt: `Create a storyboard for a video about: ${prompt}. Additional context: ${relevantData}`,
      n: 1,
      size: '1024x1024'
    });

    const imageUrl = completion.data[0].url;

    res.json({ message: 'Video generation started', storyboard: imageUrl });
  } catch (error) {
    console.error('Error generating video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 
