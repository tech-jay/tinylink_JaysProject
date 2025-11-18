const express = require('express');
const router = express.Router();
const { CODE_REGEX, isValidUrl } = require('../utils/validators');
const linksService = require('../services/linksService');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

router.post('/links', async (req, res) => {
  const { target, code } = req.body || {};
  if (!target || !isValidUrl(target)) return res.status(400).json({ error: 'Invalid target URL' });
  if (code && !CODE_REGEX.test(code)) return res.status(400).json({ error: 'Code must match [A-Za-z0-9]{6,8}' });

  let finalCode = code;
  let attempts = 0;
  try {
    while (true) {
      if (!finalCode) finalCode = generateRandomCode();
      try {
        const created = await linksService.insertLink(finalCode, target);
        return res.status(201).json({ ...created, short: `${BASE_URL}/${created.code}` });
      } catch (err) {
        if (err.code === '23505') {
          if (code) {
            return res.status(409).json({ error: 'Code already exists' });
          } else {
            attempts++;
            finalCode = null;
            if (attempts > 5) return res.status(500).json({ error: 'Could not generate unique code' });
            continue;
          }
        }
        console.error('DB insert error', err);
        return res.status(500).json({ error: 'DB error' });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/links', async (req, res) => {
  try {
    const rows = await linksService.getLinks();
    const out = rows.map(r => ({ ...r, short: `${BASE_URL}/${r.code}` }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/links/:code', async (req, res) => {
  const { code } = req.params;
  if (!CODE_REGEX.test(code)) return res.status(400).json({ error: 'Invalid code format' });
  try {
    const row = await linksService.getLinkByCode(code);
    if (!row || row.deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ code: row.code, target: row.target, clicks: row.clicks, last_clicked: row.last_clicked, created_at: row.created_at, short: `${BASE_URL}/${row.code}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.delete('/links/:code', async (req, res) => {
  const { code } = req.params;
  if (!CODE_REGEX.test(code)) return res.status(400).json({ error: 'Invalid code format' });
  try {
    const updated = await linksService.softDelete(code);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
