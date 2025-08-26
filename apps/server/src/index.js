import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();
const port = process.env.PORT || 3001;

const origins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",")
  : "*";

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
