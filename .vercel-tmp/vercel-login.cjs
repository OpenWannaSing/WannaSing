#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel']);
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
const LOG_FILE = path.join(process.cwd(), '.vercel-tmp', 'login.log');
function checkVercelInstalled() {
  if (!commandExists('vercel')) { log('Error: Vercel CLI is not installed'); process.exit(1); }
  log(`Vercel CLI version: ${getCommandOutput('vercel', ['--version']) || 'unknown'}`);
}
function checkLoginStatus() {
  try {
    const r = spawnSync('vercel', ['whoami'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: isWindows });
    const output = (r.stdout || '').trim();
    if (r.status === 0 && output && !output.includes('Error') && !output.includes('not logged in')) { log(`Logged in as: ${output}`); return true; }
  } catch {}
  return false;
}
function startBackgroundLogin() {
  const logStream = fs.openSync(LOG_FILE, 'w');
  const child = spawn('vercel', ['login'], { detached: true, stdio: ['ignore', logStream, logStream], shell: isWindows });
  child.unref();
  log(`Background login process started (PID: ${child.pid})`);
  return child.pid;
}
function openBrowser(url) {
  if (!/^https:\/\/vercel\.com\/login/.test(url) && !/^https:\/\/vercel\.com\/oauth\/device/.test(url)) { log(`Error: URL pattern check failed: ${url}`); return; }
  try {
    if (os.platform() === 'darwin') spawnSync('open', [url], { stdio: 'ignore' });
    else if (os.platform() === 'win32') spawnSync('powershell', ['-Command', `Start-Process '${url}'`], { stdio: 'ignore', windowsHide: true });
    else spawnSync('xdg-open', [url], { stdio: 'ignore' });
    log('Browser opened automatically');
  } catch (e) { log(`Failed to open browser: ${e.message}`); }
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function waitForAuthUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const match = content.match(/https:\/\/vercel\.com\/(login|oauth\/device)[^\s]*/);
        if (match) return match[0];
      }
    } catch (e) { if (e.code !== 'ENOENT') log(`Warning: ${e.code || e.message}`); }
  }
  return null;
}
async function main() {
  log('Vercel Login');
  checkVercelInstalled();
  if (checkLoginStatus()) { log('Already logged in'); console.log(JSON.stringify({ status: 'already_logged_in' })); process.exit(0); }
  const pid = startBackgroundLogin();
  log('Waiting for authorization URL...');
  const authUrl = await waitForAuthUrl();
  if (authUrl) {
    log('');
    log('Opening browser for authorization...');
    openBrowser(authUrl);
    console.log(JSON.stringify({ status: 'needs_auth', auth_url: authUrl }));
  } else {
    log('Failed to get authorization URL');
    try { const c = fs.readFileSync(LOG_FILE, 'utf8'); log('Log: ' + c); } catch(e) {}
    process.exit(1);
  }
}
main();
