const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  BatchSpanProcessor,
} = require("@opentelemetry/sdk-trace-base");

// Enable debug logs at INFO level
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Create a console exporter to verify spans are being created
const consoleExporter = new ConsoleSpanExporter();

// Create the OTLP exporter with proper settings for your Tempo configuration
const otlpExporter = new OTLPTraceExporter({
  // Use your actual Tempo host (replace localhost if needed)
  url: "http://localhost:4318/v1/traces",
  headers: {},
  timeoutMillis: 15000,
});

// Create SDK with proper span processors
const sdk = new opentelemetry.NodeSDK({
  resourceAttributes: {
    "service.name": "my-node-service",
    "service.version": "1.0.0",
    "deployment.environment": "development",
  },
  spanProcessors: [
    // Add console exporter for debugging
    new SimpleSpanProcessor(consoleExporter),
    // Use batch processor for OTLP with reasonable settings
    new BatchSpanProcessor(otlpExporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 1000,
    }),
  ],
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
    }),
  ],
});

// Initialize the SDK
try {
  sdk.start();
  console.log("✅ OpenTelemetry tracing initialized - sending to Tempo");
} catch (error) {
  console.error("Error initializing tracing:", error);
}

// Add shutdown handlers
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry SDK shut down successfully"))
    .catch((error) => console.error("Error shutting down SDK:", error))
    .finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  sdk
    .shutdown()
    .then(() => console.log("OpenTelemetry SDK shut down successfully"))
    .catch((error) => console.error("Error shutting down SDK:", error))
    .finally(() => process.exit(0));
});
