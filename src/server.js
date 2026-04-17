const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://b07a74b924e73f90b3c47d9356b8e3a1@o4511224809717760.ingest.de.sentry.io/4511224815485008",
  tracesSampleRate: 1.0,
});

const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
