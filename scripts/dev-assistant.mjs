import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit' });
// Windows cannot directly spawn a .cmd shim without a shell.
const vite = spawn(npm, ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' });

const stop = () => {
  server.kill();
  vite.kill();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => { if (code && code !== 0) vite.kill(); });
vite.on('exit', stop);
