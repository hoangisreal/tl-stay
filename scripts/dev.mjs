import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  { name: 'backend', args: ['run', 'dev', '--prefix', 'backend'] },
  { name: 'frontend', args: ['run', 'dev', '--prefix', 'frontend'] },
];

let shuttingDown = false;

const children = services.map((service) => {
  const child = spawn(npmCmd, service.args, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    if (shuttingDown) return;
    console.error(`${service.name} failed to start: ${err.message}`);
    shutdown(1);
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`${service.name} exited with ${reason}`);
    shutdown(code || 1);
  });

  return child;
});

function shutdown(code = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
