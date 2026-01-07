import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import app from "./app";
import http from "http";
import { initSocket } from "./socket";
import { auctionEngine } from "./domain/auctions/auction.engine";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

initSocket(server);

// restore auctions into memory
auctionEngine.init().catch(err => console.error('failed to init auction engine', err));

server.listen(port, () => {
  console.log(`🚀 Auction backend running on http://localhost:${port}`);
});
