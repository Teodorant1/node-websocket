// src/server.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3500;

// Create HTTP server (you can later add REST endpoints if needed)
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server running\n");
});

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server });

let count = 0;

// Broadcast function
function broadcastCount() {
  const message = JSON.stringify({ count });
  wss.clients.forEach(
    (client: { readyState: any; OPEN: any; send: (arg0: string) => void }) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  );
}

// Increment counter every second
setInterval(() => {
  count++;
  if (count > 100_000) {
    count = 0;
  }
  broadcastCount();
}, 1000);

// Handle new connections
wss.on(
  "connection",
  (ws: {
    send: (arg0: string) => void;
    on: (arg0: string, arg1: () => void) => void;
  }) => {
    console.log("Client connected");
    // Send the current count immediately
    ws.send(JSON.stringify({ count }));

    ws.on("close", () => console.log("Client disconnected"));
  }
);

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
