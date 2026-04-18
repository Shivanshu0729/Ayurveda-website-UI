const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const cors = require('cors');

const rootDir = path.join(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const clientPagesDir = path.join(clientDir, 'pages');
const configDir = path.join(rootDir, 'config');

dotenv.config({ path: path.join(configDir, '.env') });

const fetchFn = typeof fetch === 'function'
  ? fetch
  : (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const CLINIC_WHATSAPP_NUMBER = process.env.CLINIC_WHATSAPP_NUMBER || '911234567890';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

if (!GROQ_API_KEY) {
  console.warn('Warning: GROQ_API_KEY is not set. /api/chat requests will fail until it is configured.');
}

const app = express();

app.use((req, res, next) => {
  if (req.method === 'GET' && (req.path.endsWith('.html') || req.path.endsWith('.css') || req.path.endsWith('.js'))) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (CORS_ORIGIN && origin === CORS_ORIGIN) {
      return callback(null, true);
    }

    if (!CORS_ORIGIN && localhostRegex.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS blocked for origin: ' + origin));
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(clientDir));
app.use('/pages', express.static(clientPagesDir));
app.use('/css', express.static(path.join(clientDir, 'css')));
app.use('/js', express.static(path.join(clientDir, 'js')));

const dataDir = path.join(rootDir, 'data');
const contactFile = path.join(dataDir, 'contacts.json');
const chatLogFile = path.join(dataDir, 'chat-log.json');
const journeyFile = path.join(dataDir, 'journey-requests.json');

const emailConfigPresent =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.NOTIFY_TO_EMAIL;

const mailer = emailConfigPresent
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : null;

if (!mailer) {
  console.warn('Info: SMTP env vars are incomplete. Journey email notifications are disabled.');
}

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });

  for (const file of [contactFile, chatLogFile, journeyFile]) {
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

async function readJsonArray(filePath) {
  const existingText = await fs.readFile(filePath, 'utf8');
  return existingText.trim().length > 0 ? JSON.parse(existingText) : [];
}

function buildWhatsappLink(entry) {
  const message = [
    'Namaste Ayurveda Kendra team,',
    'I have submitted a journey request.',
    `Name: ${entry.name}`,
    `Track: ${entry.trackLabel || entry.track}`,
    `Email: ${entry.email}`,
    entry.phone ? `Phone: ${entry.phone}` : null,
    'Please help me with next steps.'
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${CLINIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatJourneyEmail(entry) {
  return [
    `New journey request received:`,
    ``,
    `Name: ${entry.name}`,
    `Track: ${entry.trackLabel || entry.track}`,
    `Email: ${entry.email}`,
    `Phone: ${entry.phone || '-'}`,
    `Age: ${entry.age || '-'}`,
    `Sleep Pattern: ${entry.sleepPattern || '-'}`,
    `Availability: ${entry.availability || '-'}`,
    `Main Concern: ${entry.mainConcern || '-'}`,
    `Submitted At: ${entry.submittedAt}`
  ].join('\n');
}

async function sendJourneyNotification(entry) {
  if (!mailer) return;

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  await mailer.sendMail({
    from: fromEmail,
    to: process.env.NOTIFY_TO_EMAIL,
    subject: `New Ayurveda Journey Request: ${entry.name}`,
    text: formatJourneyEmail(entry)
  });
}

function adminAccessAllowed(req) {
  if (!ADMIN_TOKEN) return true;

  const tokenFromHeader = req.headers['x-admin-token'];
  const tokenFromQuery = req.query.token;
  return tokenFromHeader === ADMIN_TOKEN || tokenFromQuery === ADMIN_TOKEN;
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

app.post('/api/journey', async (req, res) => {
  const {
    track,
    trackLabel,
    name,
    age,
    email,
    phone,
    sleepPattern,
    availability,
    mainConcern
  } = req.body || {};

  if (!track || !name || !email) {
    return res.status(400).json({ error: 'Track, name, and email are required.' });
  }

  const entry = {
    id: Date.now(),
    track,
    trackLabel: trackLabel || null,
    name,
    age: age || null,
    email,
    phone: phone || null,
    sleepPattern: sleepPattern || null,
    availability: availability || null,
    mainConcern: mainConcern || null,
    submittedAt: new Date().toISOString()
  };

  try {
    await appendJson(journeyFile, entry);

    try {
      await sendJourneyNotification(entry);
    } catch (emailError) {
      console.error('Journey email notification error:', emailError);
    }

    return res.json({
      success: true,
      whatsappUrl: buildWhatsappLink(entry)
    });
  } catch (error) {
    console.error('Journey save error:', error);
    return res.status(500).json({ error: 'Unable to save your journey request. Please try again later.' });
  }
});

app.get('/api/journey', async (req, res) => {
  if (!adminAccessAllowed(req)) {
    return res.status(401).json({ error: 'Unauthorized admin access.' });
  }

  const limitParam = Number(req.query.limit || 100);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 100;

  try {
    const allEntries = await readJsonArray(journeyFile);
    const sorted = [...allEntries].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    const items = sorted.slice(0, limit);

    const totals = {
      total: sorted.length,
      detox: sorted.filter((x) => x.track === 'detox').length,
      stress: sorted.filter((x) => x.track === 'stress').length,
      weight: sorted.filter((x) => x.track === 'weight').length,
      immunity: sorted.filter((x) => x.track === 'immunity').length
    };

    return res.json({
      totals,
      items
    });
  } catch (error) {
    console.error('Journey fetch error:', error);
    return res.status(500).json({ error: 'Unable to fetch journey requests.' });
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
  res.sendFile(path.join(clientPagesDir, 'chatbot.html'));
});

app.get('/chatbot.html', (req, res) => {
  res.redirect('/pages/chatbot.html');
});

app.get('/admin.html', (req, res) => {
  res.redirect('/pages/admin.html');
});

app.get('/journey.html', (req, res) => {
  res.redirect('/pages/journey.html');
});

app.get('/cosmic-healing.html', (req, res) => {
  res.redirect('/pages/cosmic-healing.html');
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
