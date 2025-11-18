require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount API routes under /api
app.use('/api', apiRoutes);

// Serve stats page - code.html
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'code.html'));
});

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true, version: '1.0' }));

// Redirects (catch codes as last route)
app.use('/', redirectRoutes);

// Serve index for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

// Initialize DB table if missing (simple)
const db = require('./db');
async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS links (
      code VARCHAR(8) PRIMARY KEY,
      target TEXT NOT NULL,
      clicks BIGINT NOT NULL DEFAULT 0,
      last_clicked TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      deleted BOOLEAN NOT NULL DEFAULT false
    );
  `);
}
initDb().catch(err => {
  console.error('DB init failed', err);
  process.exit(1);
});

app.listen(PORT, () => console.log(`TinyLink listening on ${PORT}`));
