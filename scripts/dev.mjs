import { spawn } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const commands = [
  ['web', 'npm run dev', join(rootDir, 'apps', 'web')],
];

if (await isPortOpen(3000)) {
  console.log('[api] Porta 3000 já está em uso; reutilizando a API existente.');
} else {
  commands.unshift(['api', 'npm run dev', join(rootDir, 'apps', 'api')]);
}

const children = commands.map(([name, command, cwd]) => {
  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
});

function stop() {
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}
