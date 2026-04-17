const express = require("express");
const fs = require("fs");
const Sentry = require("@sentry/node");

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const slowRoutes = require("./routes/slowRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Express Food Backend is running." });
});

app.use("/menu", menuRoutes);
app.use("/order", orderRoutes);
app.use("/slow", slowRoutes);

app.use(async (err, req, res, next) => {
  Sentry.captureException(err);

  // Figure out which file broke from the stack trace
  const stackLine = err.stack?.split("\n")[1] || "";
  const fileMatch = stackLine.match(/\((.+?):\d+:\d+\)/);
  const brokenFilePath = fileMatch ? fileMatch[1] : null;

  // Read the actual broken file
  let fileContent = "Could not read file";
  if (brokenFilePath && fs.existsSync(brokenFilePath)) {
    fileContent = fs.readFileSync(brokenFilePath, "utf8");
  }

  try {
    await fetch("https://jnyanu.app.n8n.cloud/webhook-test/sygna-trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        route: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        broken_file: brokenFilePath,
        source_code: fileContent,
      }),
    });
  } catch (e) {
    console.error("n8n webhook failed:", e.message);
  }

  res.status(500).json({ error: err.message });
});

module.exports = app;