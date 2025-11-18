const db = require('../db');

async function insertLink(code, target) {
  const q = `INSERT INTO links(code, target) VALUES($1, $2) RETURNING code, target, clicks, last_clicked, created_at`;
  const r = await db.query(q, [code, target]);
  return r.rows[0];
}

async function getLinks() {
  const q = `SELECT code, target, clicks, last_clicked, created_at FROM links WHERE deleted = false ORDER BY created_at DESC`;
  const r = await db.query(q);
  return r.rows;
}

async function getLinkByCode(code) {
  const q = `SELECT code, target, clicks, last_clicked, created_at, deleted FROM links WHERE code = $1`;
  const r = await db.query(q, [code]);
  return r.rows[0];
}

async function softDelete(code) {
  const q = `UPDATE links SET deleted = true WHERE code = $1 AND deleted = false RETURNING code`;
  const r = await db.query(q, [code]);
  return r.rows[0];
}

async function incrementClicksAndGetTarget(code) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const sel = await client.query('SELECT target, deleted FROM links WHERE code = $1 FOR UPDATE', [code]);
    if (sel.rowCount === 0 || sel.rows[0].deleted) {
      await client.query('ROLLBACK');
      return null;
    }
    const target = sel.rows[0].target;
    await client.query('UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE code = $1', [code]);
    await client.query('COMMIT');
    return target;
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { insertLink, getLinks, getLinkByCode, softDelete, incrementClicksAndGetTarget };
