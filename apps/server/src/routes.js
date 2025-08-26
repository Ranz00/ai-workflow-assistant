import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { createAIClient, getModel } from "./aiClient.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});
const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const schema = z.object({
      message: z.string().min(1),
      system: z.string().optional()
    });
    const { message, system } = schema.parse(req.body);

    const client = createAIClient();
    const model = getModel();
    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system || "You are a helpful full-stack assistant." },
        { role: "user", content: message }
      ],
      temperature: 0.2
    });

    res.json({ reply: resp.choices[0]?.message?.content?.trim() || "" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid request or AI error." });
  }
});

router.post("/automations/process-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "CSV file is required (field: file)." });

    const csv = req.file.buffer.toString("utf-8");
    const records = parse(csv, { columns: true, skip_empty_lines: true });

    const numericCols = new Set();
    records.forEach((row) => {
      Object.entries(row).forEach(([k, v]) => {
        const num = Number(v);
        if (!Number.isNaN(num) && v !== "") numericCols.add(k);
      });
    });

    const stats = {};
    for (const col of numericCols) {
      const vals = records.map((r) => Number(r[col])).filter((n) => !Number.isNaN(n));
      const count = vals.length;
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = count ? sum / count : 0;
      const min = count ? Math.min(...vals) : null;
      const max = count ? Math.max(...vals) : null;
      stats[col] = { count, sum, avg, min, max };
    }

    const client = createAIClient();
    const model = getModel();
    const prompt = [
      "You are a data assistant. Summarize the dataset for a product manager.",
      "Return:",
      "- 3 key insights in bullets",
      "- 1 potential risk",
      "- 1 suggested action",
      "",
      "Dataset sample (first 5 rows):",
      JSON.stringify(records.slice(0, 5), null, 2),
      "",
      "Computed stats:",
      JSON.stringify(stats, null, 2)
    ].join("\n");

    const ai = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    res.json({
      rows: records.length,
      stats,
      summary: ai.choices[0]?.message?.content?.trim() || ""
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to process CSV." });
  }
});

export default router;
