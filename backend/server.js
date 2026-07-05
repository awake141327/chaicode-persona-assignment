import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.routes.js";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Mount all route modules here as the app grows
app.use("/api/weather", weatherRoutes);

app.get("/", (req, res) => {
  res.json({ message: "ChaiCode persona assignment backend is running ☕" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
