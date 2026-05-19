import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
let hasError = false;

const check = (ok, message, hint = '') => {
  const mark = ok ? 'OK' : 'FAIL';
  console.log(`[${mark}] ${message}`);
  if (!ok) {
    hasError = true;
    if (hint) console.log(`     ${hint}`);
  }
};

const warn = (ok, message, hint = '') => {
  const mark = ok ? 'OK' : 'WARN';
  console.log(`[${mark}] ${message}`);
  if (!ok && hint) console.log(`     ${hint}`);
};

const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const versionAtLeast = (version, major) => {
  const match = version.match(/(\d+)/);
  return match ? Number(match[1]) >= major : false;
};

const npmVersion = () => {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(cmd, ['--version'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
};

console.log('TL-Stay local setup check\n');

check(versionAtLeast(process.version, 20), `Node.js ${process.version}`, 'Install Node.js 20 or newer.');

const npm = npmVersion();
check(versionAtLeast(npm, 10), npm ? `npm ${npm}` : 'npm not found', 'Install npm 10 or newer.');

check(exists('backend/package.json'), 'backend/package.json exists');
check(exists('frontend/package.json'), 'frontend/package.json exists');
check(exists('backend/.env.example'), 'backend/.env.example exists');
check(exists('frontend/.env.example'), 'frontend/.env.example exists');

warn(exists('backend/node_modules'), 'backend dependencies installed', 'Run: npm run install:all');
warn(exists('frontend/node_modules'), 'frontend dependencies installed', 'Run: npm run install:all');

const backendEnvPath = path.join(root, 'backend/.env');
if (fs.existsSync(backendEnvPath)) {
  const env = fs.readFileSync(backendEnvPath, 'utf8');
  const hasMongoUri = /^MONGO_URI\s*=\s*\S+/m.test(env);
  warn(
    !hasMongoUri,
    hasMongoUri ? 'backend/.env sets MONGO_URI' : 'backend/.env leaves MONGO_URI unset',
    'If MONGO_URI is set, make sure MongoDB is running. Comment it out for zero-setup demo mode.'
  );
} else {
  console.log('[OK] backend/.env is optional for demo mode');
}

console.log('\nExpected local commands:');
console.log('  npm run install:all');
console.log('  npm run dev');
console.log('\nExpected URLs:');
console.log('  Frontend: http://localhost:5173');
console.log('  Backend:  http://localhost:5000/api');

process.exit(hasError ? 1 : 0);
