import express from "express";
import axios from "axios";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

const LANGUAGE_IDS = {
  javascript: 63,
  python:     71,
  java:       62,
  c:          50,
  cpp:        54,
  "c++":      54,
};

router.post("/run", verifyToken, async (req, res) => {
  try {
    const { code, language, stdin = "" } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "code and language are required" });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const { data } = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code:    code,
        language_id:    languageId,
        stdin,
        cpu_time_limit: 5,
        memory_limit:   128000,
      },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 }
    );

    res.json({
      stdout:        data.stdout          || "",
      stderr:        data.stderr          || "",
      compileError:  data.compile_output  || "",
      status:        data.status?.description || "Unknown",
      executionTime: data.time,
      memory:        data.memory,
    });

  } catch (err) {
    console.error("Judge0 error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Code execution failed",
      detail: err.code === "ECONNREFUSED"
        ? "Judge0 is not running. Run: cd C:\\judge0\\judge0-v1.13.1 && docker compose up -d"
        : (err.response?.data?.message || err.message),
    });
  }
});

export default router;
