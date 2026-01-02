import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import app from "./app";

app.listen(process.env.PORT, () => {
  console.log(`🚀 Auction backend running on http://localhost:${process.env.PORT}`);
});
