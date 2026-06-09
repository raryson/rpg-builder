import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(root, 'apps', 'web');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = { ...process.env };

for (const key of Object.keys(env)) {
  if (key.toLowerCase().startsWith('npm_')) {
    delete env[key];
  }
}

const result = spawnSync(npmCommand, ['run', 'build'], {
  cwd: webDir,
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
