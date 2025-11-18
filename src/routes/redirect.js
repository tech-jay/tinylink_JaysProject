const express = require('express');
const router = express.Router();
const { CODE_REGEX } = require('../utils/validators');
const linksService = require('../services/linksService');

router.get('/:code', async (req, res, next) => {
  const { code } = req.params;
  if (['api', 'code', 'healthz', 'favicon.ico'].includes(code)) return next();
  if (!CODE_REGEX.test(code)) return res.status(404).send('Not found');

  try {
    const target = await linksService.incrementClicksAndGetTarget(code);
    if (!target) return res.status(404).send('Not found');
    return res.redirect(302, target);
  } catch (err) {
    console.error('Redirect error', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
