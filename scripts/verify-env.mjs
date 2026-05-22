import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const envPath = path.join(root, '.env.local');
const packagePath = path.join(root, 'package.json');

console.log('Project folder:', root);

if (!fs.existsSync(packagePath)) {
  console.error('ERROR: package.json not found. Run this from the project root (folder with package.json).');
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local is missing.');
  console.error('Create it with: cp .env.example .env.local');
  console.error('Then paste your Firebase values and run: npm run verify-env');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const values = Object.fromEntries(
  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      if (index === -1) {
        return [line, ''];
      }
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const missing = requiredKeys.filter((key) => !values[key]);
const empty = requiredKeys.filter((key) => values[key] === '');

if (missing.length || empty.length) {
  console.error('ERROR: .env.local exists but Firebase variables are incomplete.');
  if (missing.length) {
    console.error('Missing keys:', missing.join(', '));
  }
  if (empty.length) {
    console.error('Empty keys:', empty.join(', '));
  }
  process.exit(1);
}

console.log('OK: .env.local has all required VITE_FIREBASE_* variables.');
console.log('Next: stop the dev server (Ctrl+C), then run: npm run dev');
