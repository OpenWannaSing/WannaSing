#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel', 'npm', 'pnpm', 'yarn']);
function log(msg) { console.error(msg); }
function commandExists(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) throw new Error(`Command not in whitelist: ${cmd}`);
  try {
    if (isWindows) { const r = spawnSync('where', [cmd], { stdio: 'ignore' }); return r.status === 0; }
    else { const r = spawnSync('sh', ['-c', `command -v "$1"`, '--', cmd], { stdio: 'ignore' }); return r.status === 0; }
  } catch { return false; }
}
function getCommandOutput(cmd, args) {
  try { const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: isWindows }); return r.status === 0 ? (r.stdout || '').trim() : null; }
  catch { return null; }
}
const projectPath = process.argv[2] || '.';
const absPath = path.resolve(projectPath);
function checkVercelInstalled() {
  if (!commandExists('vercel')) { log('Error: Vercel CLI not installed'); process.exit(1); }
  log(`Vercel CLI: ${getCommandOutput('vercel', ['--version'])}`);
}
function checkLoginStatus() {
  try {
    const r = spawnSync('vercel', ['whoami'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: isWindows });
    const output = (r.stdout || '').trim();
    if (r.status === 0 && output && !output.includes('Error')) { log(`Logged in as: ${output}`); return true; }
  } catch {}
  return false;
}
function main() {
  log('Deploying frontend to Vercel...');
  checkVercelInstalled();
  if (!checkLoginStatus()) { log('Error: Not logged in'); process.exit(1); }
  log(`Project: ${absPath}`);
  log('');
  const args = ['--prod', '--yes'];
  log(`Running: vercel ${args.join(' ')}`);
  const result = spawnSync('vercel', args, { cwd: absPath, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'], timeout: 300000, shell: isWindows });
  const output = (result.stdout || '') + (result.stderr || '');
  log(output);
  if (result.status !== 0) { log('Deployment failed'); process.exit(1); }
  const urlMatch = output.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/);
  const url = urlMatch ? urlMatch[0] : null;
  log('Deployment successful!');
  if (url) {
    log(`URL: ${url}`);
    console.log(JSON.stringify({ url, status: 'success' }));
  } else {
    console.log(JSON.stringify({ status: 'success' }));
  }
}
main();
