/* scripts/run-migrate.js */
const { execSync } = require('child_process');

const db = process.env.DATABASE_URL;
if (!db) {
  console.error('ERROR: DATABASE_URL not set. Example: setx DATABASE_URL "postgres://gjaya:pass@localhost:5432/tinylink" (then open a new terminal), or run: $env:DATABASE_URL = \"postgres://gjaya:123456789@localhost:5432/tinylink\" for the current session.');
  process.exit(1);
}

try {
  // hide password in the printed URL for safety
  const safe = db.replace(/:\/\/(.*?):.*?@/, '://$1:***@');
  console.log('Running migration with DB:', safe);
  execSync(`psql "${db}" -f migrations/001_create_links.sql`, { stdio: 'inherit' });
} catch (err) {
  console.error('Migration failed.');
  process.exit(err.status || 1);
}
