import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { mkdir, readdir, readFile, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { userInfo } from 'node:os';
const web = process.cwd();
const api = resolve(process.env.REAL_API_DIR ?? '../jlpt-api');
const apiPort = Number(process.env.REAL_API_PORT ?? 4617);
const webPort = Number(process.env.REAL_WEB_PORT ?? 3117);
const qa = resolve(process.env.REAL_QA_DIR ?? '../qa');
const name = `jlpt_v2_test_browser_${randomBytes(8).toString('hex')}`;
const secret = 'synthetic-browser-session-secret-no-production-credentials';
const adminUrl = new URL(process.env.TEST_DATABASE_ADMIN_URL ??
  `postgres://${encodeURIComponent(userInfo().username)}@localhost:5432/postgres`);
if (!['postgres:', 'postgresql:'].includes(adminUrl.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(adminUrl.hostname))
  throw new Error('TEST_DATABASE_ADMIN_URL must point to local PostgreSQL');
const testUrl = new URL(adminUrl); testUrl.pathname = `/${name}`;
const dbUrl = testUrl.href;
// Intentionally do not inherit provider keys or load a .env file.
const env = { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
  REAL_API_DIR: api, REAL_QA_DIR: qa, REAL_API_PORT: String(apiPort), REAL_WEB_PORT: String(webPort),
  DATABASE_URL: dbUrl, SESSION_SECRET: secret, NODE_ENV: 'test', PORT: String(apiPort),
  FRONTEND_URL: `http://127.0.0.1:${webPort}`, GOOGLE_CLIENT_ID: 'browser-dummy', GOOGLE_CLIENT_SECRET: 'browser-dummy',
  GOOGLE_CALLBACK_URL: `http://127.0.0.1:${apiPort}/api/v1/auth/google/callback`,
  AI_WORKER_ENABLED: 'false', GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '',
  REVIEW_ALGORITHM_MODE: 'adaptive', REVIEW_ALGORITHM_ROLLOUT_PERCENT: '100',
  NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}/api/v1`, NEXT_TELEMETRY_DISABLED: '1' };
Object.assign(process.env, { REAL_API_DIR: api, DATABASE_URL: dbUrl });
const { Client, seed } = await import('./database.mjs');
for (const folder of [api, web]) {
  if ((await readdir(folder)).some(file => /^\.env($|\.)/.test(file) && !file.endsWith('.example')))
    throw new Error('Run in isolated worktrees with no .env files');
}
for (const port of [apiPort, webPort]) await new Promise((ok, fail) => {
  const server = createServer(); server.once('error', fail); server.listen(port, '127.0.0.1', () => server.close(ok));
});
await mkdir(qa, { recursive: true });
const children = [];
const logs = [];
async function start(command, args, cwd, label, overrides = {}) {
  const file = await open(resolve(qa, `${label}.log`), 'w'); logs.push(file);
  const child = spawn(command, args, { cwd, env: { ...env, ...overrides }, stdio: ['ignore', file.fd, file.fd], detached: true });
  children.push(child);
  child.done = new Promise((ok, fail) => { child.once('error', fail); child.once('exit', code => ok(code)); });
  return child;
}
async function command(command, args, cwd, label, overrides) {
  const child = await start(command, args, cwd, label, overrides);
  if (await child.done !== 0) throw new Error(`${label} failed; inspect ${qa}/${label}.log`);
}
async function ready(url, child) {
  for (let count = 0; count < 150; count++) {
    if (child.exitCode !== null) throw new Error(`Server exited before ${url}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(ok => setTimeout(ok, 400));
  }
  throw new Error(`Server never became ready: ${url}`);
}
const admin = new Client({ connectionString: adminUrl.href });
await admin.connect();
let created = false;
try {
  await admin.query(`CREATE DATABASE "${name}"`); created = true;
  const db = new Client({ connectionString: dbUrl }); await db.connect();
  try {
    const migrations = (await readdir(resolve(api, 'prisma/migrations'), { withFileTypes: true }))
      .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    for (const migration of migrations)
      await db.query(await readFile(resolve(api, 'prisma/migrations', migration, 'migration.sql'), 'utf8'));
    console.log(`Applied ${migrations.length} migrations to ${name}`);
  } finally { await db.end(); }
  await seed();
  await command('npm', ['run', 'build'], api, 'browser-api-build');
  await command('npm', ['run', 'build'], web, 'browser-web-build', { NODE_ENV: 'production' });
  const apiChild = await start(process.execPath, ['dist/src/main.js'], api, 'browser-api');
  await ready(`http://127.0.0.1:${apiPort}/api/v1/health`, apiChild);
  const webChild = await start(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(webPort)], web, 'browser-web', { NODE_ENV: 'production' });
  await ready(`http://127.0.0.1:${webPort}/login`, webChild);
  await command(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.real.config.ts', ...process.argv.slice(2)], web, 'browser-tests');
  console.log(`Real-stack browser QA passed. Evidence: ${qa}`);
} finally {
  for (const child of children) if (child.exitCode === null) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
  await Promise.all(children.map(child => child.done));
  for (const log of logs) await log.close();
  if (created) {
    await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1', [name]);
    await admin.query(`DROP DATABASE "${name}"`);
    console.log(`Dropped own database ${name}`);
  }
  await admin.end();
}
