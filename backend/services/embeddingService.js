const axios = require('axios');
const { InferenceClient } = require('@huggingface/inference');

const hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
const JINA_API_KEY = process.env.JINA_API_KEY;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate CLIP embedding using Jina CLIP v2
// Accepts both text and image URL — produces 1024-dim vectors
async function getJinaEmbedding(input, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.post(
        'https://api.jina.ai/v1/embeddings',
        {
          model: 'jina-clip-v2',
          input: [input], // input is { text: '...' } or { image: 'url' }
        },
        {
          headers: {
            Authorization: `Bearer ${JINA_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data[0].embedding;
    } catch (err) {
      const msg = err?.response?.data?.detail?.message || err?.message || '';
      console.error(`Jina embedding error (attempt ${i + 1}):`, msg);
      if (i < retries - 1) {
        await wait(5000);
      }
    }
  }
  return null;
}

// Generate SBERT embedding using Hugging Face
// Produces 384-dim semantic text vectors
async function getSbertEmbedding(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await hfClient.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
      });
      return Array.isArray(result[0]) ? result[0] : Array.from(result);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('loading') && i < retries - 1) {
        console.log('SBERT loading, retrying in 10s...');
        await wait(10000);
      } else {
        console.error('SBERT embedding error:', msg);
        return null;
      }
    }
  }
  return null;
}

// Generate all embeddings for an item
// - clipTextEmbedding: Jina CLIP embedding of item text (1024-dim)
// - imageEmbedding: Jina CLIP embedding of item image (1024-dim, same space as text)
// - sbertEmbedding: SBERT embedding of full description (384-dim)
async function generateItemEmbeddings(imageUrl, text) {
  console.log('Generating embeddings for item...');

  const [clipTextEmbedding, imageEmbedding, sbertEmbedding] = await Promise.all([
    getJinaEmbedding({ text }),
    imageUrl ? getJinaEmbedding({ image: imageUrl }) : Promise.resolve(null),
    getSbertEmbedding(text),
  ]);

  console.log('Embeddings generated:', {
    hasClipText: !!clipTextEmbedding,
    hasImageEmbedding: !!imageEmbedding,
    hasSbert: !!sbertEmbedding,
  });

  return {
    clipTextEmbedding,
    imageEmbedding,
    sbertEmbedding,
  };
}

module.exports = { generateItemEmbeddings };
