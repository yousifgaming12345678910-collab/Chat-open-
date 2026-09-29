# Open Chat backend

A small real-time WebSocket backend with SQLite message history.

## Run locally

```bash
npm install
npm start
```

HTTP health check: `GET /health`
Message history: `GET /api/messages`
WebSocket: `ws://localhost:3000/chat`

## Deploy

Deploy this folder to Render, Railway, Fly.io, or another Node host. Set `ROOM_KEY` to a private random room key and use a persistent disk for `chat.db`.

The frontend must connect to `wss://YOUR-HOST/chat` and send JSON like:

```json
{"name":"Yousif","text":"hello"}
```

This backend intentionally has no passwords or personal-data collection. Add moderation/rate limiting before sharing the link widely.
