import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DB_NAME = 'arcade-highscores-db';
const WRANGLER_PATH = path.resolve('wrangler.toml');

function run(cmd, allowFail = false) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (!allowFail) {
      console.error(err.stdout || '');
      console.error(err.stderr || err.message);
      throw err;
    }
    return `${err.stdout || ''}\n${err.stderr || ''}`;
  }
}

console.log(`1/4 D1-database '${DB_NAME}' controleren of aanmaken...`);
let listOut = run('npx wrangler d1 list --json', true);
let databaseId = '';
try {
  const parsed = JSON.parse(listOut);
  if (Array.isArray(parsed)) {
    const found = parsed.find((d) => d?.name === DB_NAME);
    if (found?.uuid) databaseId = found.uuid;
  }
} catch {
  // ignore parse errors, try create
}

if (!databaseId) {
  const createOut = run(`npx wrangler d1 create ${DB_NAME}`, true);
  const match = createOut.match(/database_id\s*=\s*"([a-f0-9-]+)"/i);
  if (match) {
    databaseId = match[1];
  } else {
    // Re-check list in case it already existed
    const retryList = run('npx wrangler d1 list --json', true);
    try {
      const parsed = JSON.parse(retryList);
      const found = Array.isArray(parsed) ? parsed.find((d) => d?.name === DB_NAME) : null;
      if (found?.uuid) databaseId = found.uuid;
    } catch {
      // ignore
    }
  }
}

if (!databaseId) {
  console.error('❌ Kon geen Cloudflare D1 database_id vinden. Zorg dat je ingelogd bent (npx wrangler login) of CLOUDFLARE_API_TOKEN hebt ingesteld.');
  process.exit(1);
}

console.log(`✓ D1 database_id: ${databaseId}`);
console.log('2/4 wrangler.toml bijwerken...');
let toml = fs.readFileSync(WRANGLER_PATH, 'utf8');
toml = toml.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${databaseId}"`);
fs.writeFileSync(WRANGLER_PATH, toml, 'utf8');

console.log('3/4 D1 tabellen (schema.sql) toepassen op Cloudflare...');
execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file=./schema.sql --yes`, {
  stdio: 'inherit',
});

console.log('4/4 Cloudflare Worker deployen...');
execSync('npx wrangler deploy', { stdio: 'inherit' });
console.log('\n✅ Klaar! Kopieer de *.workers.dev URL hierboven en plak hem in je apps (of in GitHub variabele VITE_API_URL).');
