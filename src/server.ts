import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// Extend WebSocket type to include isAlive property
declare module "ws" {
  interface WebSocket {
    isAlive?: boolean;
  }
}

const PORT = process.env.PORT || 3500;

// --- Create HTTP server (optional for REST routes) ---
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server running\n");
});

// --- Attach WebSocket server ---
const wss = new WebSocketServer({ server });

// --- Global counter example ---
let count = 0;

// --- Heartbeat / keep-alive system ---
function heartbeat(this: any) {
  this.isAlive = true;
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.isAlive = true;
  ws.on("pong", heartbeat);

  // Send initial count
  ws.send(JSON.stringify({ count }));

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// --- Broadcast current count to all connected clients ---
function broadcastCount() {
  const message = JSON.stringify({ count });
  wss.clients.forEach((client: any) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// --- Increment counter every second ---
const countInterval = setInterval(() => {
  count++;
  if (count > 100_000) count = 0;
  broadcastCount();
}, 1000);

// --- Ping clients every 30 seconds to remove dead ones ---
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (ws.isAlive === false) {
      console.log("Terminating dead connection");
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

// --- Graceful shutdown handling ---
function shutdown() {
  console.log("Shutting down gracefully...");
  clearInterval(countInterval);
  clearInterval(heartbeatInterval);

  // Close all client connections
  wss.clients.forEach((ws) => ws.close());
  wss.close(() => {
    server.close(() => {
      console.log("Server closed cleanly.");
      process.exit(0);
    });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// --- Start server ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
