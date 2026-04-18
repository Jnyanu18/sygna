const express = require("express");
const fs = require("fs");
const path = require("path");
const Sentry = require("@sentry/node");

require("tsx/cjs/api").register({
  tsconfig: path.join(__dirname, "..", "tsconfig.json"),
});
const { registerSygnaRoutes } = require("../server/register");

const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const slowRoutes = require("./routes/slowRoutes");

const app = express();

app.use(express.json());

registerSygnaRoutes(app);

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
    const res2 = await fetch("http://127.0.0.1:3000/api/sentry-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: err.message,
        stacktrace: err.stack,
        route: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        broken_file: brokenFilePath,
        source_code: fileContent,
      }),
    });
    console.log("Webhook response:", res2.status, await res2.text());
  } catch (e) {
    console.error("sygna webhook failed:", e.message);
  }

  if (err && err.id !== null && err.id !== undefined) {
    res.status(500).json({ error: err.message, id: err.id });
  } else {
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;