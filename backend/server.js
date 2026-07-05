import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Local dev origins plus the deployed frontend (set FRONTEND_URL
// on the host, e.g. https://your-app.vercel.app — no trailing slash)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Mount all route modules here as the app grows
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ChaiCode persona assignment backend is running ☕" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
