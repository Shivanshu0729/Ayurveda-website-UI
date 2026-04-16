const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

dotenv.config();

const fetchFn = typeof fetch === 'function'
  ? fetch
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. /api/chat requests will fail until it is configured.');
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const dataDir = path.join(__dirname, 'data');
const contactFile = path.join(dataDir, 'contacts.json');
const chatLogFile = path.join(dataDir, 'chat-log.json');

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });

  for (const file of [contactFile, chatLogFile]) {
    try {
      await fs.access(file);
    } catch {
      await fs.writeFile(file, '[]', 'utf8');
    }
  }
}

async function appendJson(filePath, newItem) {
  const existingText = await fs.readFile(filePath, 'utf8');
  const existing = existingText.trim().length > 0 ? JSON.parse(existingText) : [];
  existing.push(newItem);
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf8');
}

app.post('/api/contact', async (req, res) => {
  const { name, age, gender, locality, email, phone } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const entry = {
    id: Date.now(),
    name,
    age: age || null,
    gender: gender || null,
    locality: locality || null,
    email,
    phone: phone || null,
    submittedAt: new Date().toISOString()
  };

  try {
    await appendJson(contactFile, entry);
    return res.json({ success: true });
  } catch (error) {
    console.error('Contact save error:', error);
    return res.status(500).json({ error: 'Unable to save your request. Please try again later.' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server is not configured with a model API key.' });
  }

  const payload = {
    model: GROQ_MODEL,
    max_tokens: 300,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `You are a warm, conversational Ayurveda guide for Ayurveda Kendra. Respond naturally to whatever the user says. Answer ONLY what they specifically ask. Do NOT list out treatments or give a welcome speech unless explicitly asked. If they just say 'Hi', just say hello back and ask how you can help. Keep replies short (1-3 sentences). Occasionally use 🙏 or 🌿. Gently mention the registration form only if they want to book or need personalized advice. No medical diagnoses.`
      },
      {
        role: 'user',
        content: message.trim()
      }
    ]
  };

  try {
    const response = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errorBody.error?.message || 'Model API request failed.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('No reply from model.');
    }

    await appendJson(chatLogFile, {
      id: Date.now(),
      direction: 'user',
      text: message.trim(),
      createdAt: new Date().toISOString()
    });
    await appendJson(chatLogFile, {
      id: Date.now() + 1,
      direction: 'assistant',
      text: reply,
      createdAt: new Date().toISOString()
    });

    return res.json({ reply });
  } catch (error) {
    console.error('Chat proxy error:', error);
    return res.status(500).json({ error: 'Unable to generate a response at this time.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot.html'));
});

ensureDataFiles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ayurveda backend running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
  });
