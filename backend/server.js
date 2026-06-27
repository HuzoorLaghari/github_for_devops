const express = require('express');
const cors = require('cors');
const { initDb, addVisit, getVisitCount, addMessage, getMessages } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/visits', async (_req, res) => {
  try {
    const count = await getVisitCount();
    res.json({ count });
  } catch (err) {
    console.error('Error fetching visit count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const visit = await addVisit(req.body.page || '/');
    const count = await getVisitCount();
    res.status(201).json({ visit, count });
  } catch (err) {
    console.error('Error recording visit:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages', async (_req, res) => {
  try {
    const messages = await getMessages();
    res.json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  try {
    const msg = await addMessage(name, message);
    res.status(201).json({ message: msg });
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start();
