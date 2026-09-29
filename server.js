import express from 'express';
import cors from 'cors';
import http from 'http';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 3000;
const ROOM_KEY = process.env.ROOM_KEY || 'public-lobby';
const db = new Database(process.env.DB_PATH || 'chat.db');
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, room TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL)`);
const recent = db.prepare('SELECT * FROM messages WHERE room = ? ORDER BY created_at DESC LIMIT 100').all(ROOM_KEY).reverse();
const app = express();
app.use(cors()); app.use(express.json({ limit: '4kb' }));
app.get('/health', (_, res) => res.json({ ok: true, room: ROOM_KEY }));
app.get('/api/messages', (_, res) => res.json(db.prepare('SELECT * FROM messages WHERE room = ? ORDER BY created_at ASC LIMIT 100').all(ROOM_KEY)));
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/chat' });
const clients = new Set();
function broadcast(payload) { const data = JSON.stringify(payload); for (const ws of clients) if (ws.readyState === 1) ws.send(data); }
wss.on('connection', ws => {
  clients.add(ws); ws.send(JSON.stringify({ type: 'history', messages: recent }));
  ws.on('message', raw => {
    try {
      const body = JSON.parse(raw.toString());
      const name = String(body.name || 'Guest').trim().slice(0, 32) || 'Guest';
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!text) return;
      const message = { id: crypto.randomUUID(), room: ROOM_KEY, name, text, created_at: new Date().toISOString() };
      db.prepare('INSERT INTO messages VALUES (@id,@room,@name,@text,@created_at)').run(message);
      recent.push(message); if (recent.length > 100) recent.shift(); broadcast({ type: 'message', message });
    } catch { ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' })); }
  });
  ws.on('close', () => clients.delete(ws));
});
server.listen(PORT, () => console.log(`Open Chat backend listening on ${PORT}`));
