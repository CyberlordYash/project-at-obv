require("./tracing.js"); // Initialize OpenTelemetry tracing
const express = require("express");
const client = require("prom-client"); // Metric collection
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const options = {
  transports: [
    new LokiTransport({
      host: "http://127.0.0.1:3100",
    }),
  ],
};

const logger = createLogger(options);
const app = express();
const port = 3000;

// Create a Registry to hold all metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// 1️⃣ Request Rate (RPS) Counter
const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestTotal);

// 2️⃣ API Latency (Histogram)
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Histogram of response times in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10], // Define latency buckets
});
register.registerMetric(httpRequestDuration);

// 3️⃣ Error Rate Counter
const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of failed HTTP requests",
  labelNames: ["method", "route", "status_code"],
});
register.registerMetric(httpRequestErrors);

// Middleware to track metrics
app.use((req, res, next) => {
  const start = process.hrtime();
  logger.info(`Incoming request: ${req.method} ${req.path}`);

  res.on("finish", () => {
    const duration = process.hrtime(start);
    const responseTimeInSeconds = duration[0] + duration[1] / 1e9;

    httpRequestTotal.inc({
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
    });
    httpRequestDuration.observe(
      { method: req.method, route: req.path, status_code: res.statusCode },
      responseTimeInSeconds
    );

    if (res.statusCode >= 400) {
      httpRequestErrors.inc({
        method: req.method,
        route: req.path,
        status_code: res.statusCode,
      });
      logger.error(
        `Error response: ${req.method} ${req.path} - ${res.statusCode}`
      );
    } else {
      logger.info(
        `Response sent: ${req.method} ${req.path} - ${res.statusCode}`
      );
    }
  });

  next();
});

// Expose metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// Dummy home route
app.get("/", (req, res) => {
  res.send("Welcome");
});

// Simulated async function for slow response and errors
const asyncFunction = async () => {
  return new Promise((resolve, reject) => {
    const randomTime = Math.floor(Math.random() * 10000);
    const shouldThrowError = Math.random() < 0.3;

    setTimeout(() => {
      if (shouldThrowError) {
        const errorMessages = [
          "Server failed to respond",
          "Database connection lost",
          "Service unavailable",
          "Internal server error",
          "Timeout error",
          "Unexpected server error",
        ];
        const error = new Error(
          errorMessages[Math.floor(Math.random() * errorMessages.length)]
        );
        logger.error(`Slow API error: ${error.message}`);
        reject(error);
      } else {
        logger.info("Slow API responded successfully");
        resolve("Slow response");
      }
    }, randomTime);
  });
};

// Route that calls the asynchronous function (slow API)
app.get("/slow", async (req, res) => {
  try {
    const result = await asyncFunction();
    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start Express server
app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
