import express from "express";
import routes from "./rootRoutes";
const app = express();

app.use(express.json());

// 👇 HEALTH CHECK (ADD THIS)
app.get("/health", (_, res) => {
  res.json({ status: "OK" });
});

// 👇 API ROUTES
app.use("/api", routes);

export default app;