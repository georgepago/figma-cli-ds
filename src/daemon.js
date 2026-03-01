#!/usr/bin/env node

/**
 * Figma CLI Daemon
 *
 * Supports two modes:
 * - Yolo Mode (CDP): Direct connection via Chrome DevTools Protocol (fast, requires patching)
 * - Safe Mode (Plugin): Connection via Figma plugin WebSocket (secure, no patching)
 */

import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { FigmaClient } from './figma-client.js';
import { loadRegistry } from './lib-registry.js';

const PORT = parseInt(process.env.DAEMON_PORT) || 3456;
const MODE = process.env.DAEMON_MODE || 'auto'; // 'auto', 'cdp', 'plugin'

// CDP Client (Yolo Mode)
let cdpClient = null;
let isCdpConnecting = false;

// Plugin Client (Safe Mode)
let pluginWs = null;
let pluginPendingRequests = new Map();
let pluginMsgId = 0;

// ============ CDP MODE (YOLO) ============

async function isCdpHealthy() {
  if (!cdpClient || !cdpClient.ws) return false;
  if (cdpClient.ws.readyState !== 1) return false;

  try {
    const result = await Promise.race([
      cdpClient.eval('typeof figma !== "undefined"'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    return result === true;
  } catch {
    return false;
  }
}

async function getCdpClient() {
  if (cdpClient) {
    const healthy = await isCdpHealthy();
    if (healthy) return cdpClient;

    console.log('[daemon] CDP connection stale, reconnecting...');
    try { cdpClient.close(); } catch {}
    cdpClient = null;
  }

  if (isCdpConnecting) {
    while (isCdpConnecting) {
      await new Promise(r => setTimeout(r, 100));
    }
    return cdpClient;
  }

  isCdpConnecting = true;
  try {
    cdpClient = new FigmaClient();
    await cdpClient.connect();
    console.log('[daemon] Connected to Figma via CDP (Yolo Mode)');
  } finally {
    isCdpConnecting = false;
  }
  return cdpClient;
}

async function evalViaCdp(code) {
  const client = await getCdpClient();
  return client.eval(code);
}

// ============ PLUGIN MODE (SAFE) ============

function isPluginConnected() {
  return pluginWs && pluginWs.readyState === WebSocket.OPEN;
}

async function evalViaPlugin(code) {
  if (!isPluginConnected()) {
    throw new Error('Plugin not connected. Start the Figma CLI Bridge plugin in Figma.');
  }

  return new Promise((resolve, reject) => {
    const id = ++pluginMsgId;
    const timeout = setTimeout(() => {
      pluginPendingRequests.delete(id);
      reject(new Error('Plugin execution timeout'));
    }, 30000);

    pluginPendingRequests.set(id, { resolve, reject, timeout });

    pluginWs.send(JSON.stringify({
      action: 'eval',
      id: id,
      code: code
    }));
  });
}

// ============ UNIFIED EVAL ============

async function executeEval(code) {
  // Auto mode: prefer plugin if connected, fallback to CDP
  if (MODE === 'auto') {
    if (isPluginConnected()) {
      return evalViaPlugin(code);
    }
    return evalViaCdp(code);
  }

  // Explicit mode
  if (MODE === 'plugin') {
    return evalViaPlugin(code);
  }

  return evalViaCdp(code);
}

function getMode() {
  if (MODE === 'plugin') return 'safe';
  if (MODE === 'cdp') return 'yolo';
  // Auto: return what's actually connected
  if (isPluginConnected()) return 'safe';
  if (cdpClient) return 'yolo';
  return 'disconnected';
}

// ============ HTTP SERVER ============

async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    const mode = getMode();
    const pluginConnected = isPluginConnected();
    const cdpHealthy = await isCdpHealthy();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: (pluginConnected || cdpHealthy) ? 'ok' : 'disconnected',
      mode: mode,
      plugin: pluginConnected,
      cdp: cdpHealthy
    }));
    return;
  }

  // Force reconnect (CDP only)
  if (req.url === '/reconnect') {
    try {
      if (cdpClient) {
        try { cdpClient.close(); } catch {}
        cdpClient = null;
      }
      await getCdpClient();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'reconnected', mode: 'yolo' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Execute command
  if (req.url === '/exec' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const MAX_RETRIES = 2;
      let lastError;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { action, code, jsx, jsxArray } = JSON.parse(body);
          let result;

          const execWithTimeout = async (fn) => {
            return Promise.race([
              fn(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Execution timeout')), 30000)
              )
            ]);
          };

          switch (action) {
            case 'eval':
              result = await execWithTimeout(() => executeEval(code));
              break;
            case 'render':
              // Parse JSX to code, then execute via unified eval (works with both CDP and Plugin)
              const parser = new FigmaClient();
              const hasLib = /<Instance\s+[^>]*(lib|key)=/.test(jsx);
              const reg = hasLib ? loadRegistry() : null;
              const renderCode = parser.parseJSX(jsx, reg);
              result = await execWithTimeout(() => executeEval(renderCode));
              break;
            case 'render-batch':
              const batchParser = new FigmaClient();
              const anyLib = (jsxArray || []).some(j => /<Instance\s+[^>]*(lib|key)=/.test(j));
              const batchReg = anyLib ? loadRegistry() : null;
              result = [];
              for (const j of jsxArray) {
                const batchCode = batchParser.parseJSX(j, batchReg);
                result.push(await execWithTimeout(() => executeEval(batchCode)));
              }
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result, mode: getMode() }));
          return;
        } catch (error) {
          lastError = error;
          console.log(`[daemon] Attempt ${attempt + 1} failed: ${error.message}`);

          // Force reconnect before retry (CDP only)
          if (attempt < MAX_RETRIES && !isPluginConnected()) {
            console.log('[daemon] Reconnecting before retry...');
            try { cdpClient.close(); } catch {}
            cdpClient = null;
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: lastError.message }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

// ============ START SERVERS ============

const httpServer = createServer(handleRequest);

// WebSocket server for plugin connections
const wss = new WebSocketServer({ server: httpServer, path: '/plugin' });

wss.on('connection', (ws) => {
  console.log('[daemon] Plugin connected (Safe Mode)');
  pluginWs = ws;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'hello') {
        console.log(`[daemon] Plugin version: ${msg.version}`);
      }

      if (msg.type === 'result') {
        const pending = pluginPendingRequests.get(msg.id);
        if (pending) {
          clearTimeout(pending.timeout);
          pluginPendingRequests.delete(msg.id);

          if (msg.error) {
            pending.reject(new Error(msg.error));
          } else {
            pending.resolve(msg.result);
          }
        }
      }

      if (msg.type === 'pong') {
        // Health check response
      }
    } catch (e) {
      console.error('[daemon] Plugin message error:', e);
    }
  });

  ws.on('close', () => {
    console.log('[daemon] Plugin disconnected');
    pluginWs = null;

    // Reject all pending requests
    for (const [id, pending] of pluginPendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Plugin disconnected'));
    }
    pluginPendingRequests.clear();
  });

  ws.on('error', (error) => {
    console.error('[daemon] Plugin WebSocket error:', error.message);
  });
});

httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`[daemon] Figma CLI daemon running on port ${PORT}`);
  console.log(`[daemon] Mode: ${MODE === 'auto' ? 'auto (plugin preferred, CDP fallback)' : MODE}`);
});

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('[daemon] Shutting down...');
  if (cdpClient) cdpClient.close();
  if (pluginWs) pluginWs.close();
  httpServer.close(() => process.exit(0));
}

// In auto/cdp mode, pre-connect to Figma
if (MODE !== 'plugin') {
  getCdpClient().catch(err => {
    console.log('[daemon] CDP not available, waiting for plugin connection...');
  });
}
