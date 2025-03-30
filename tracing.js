const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");

// Create a simpler SDK configuration
const sdk = new opentelemetry.NodeSDK({
  // Use resource attributes directly instead of Resource constructor
  resourceAttributes: {
    "service.name": "my-node-service",
    "service.version": "1.0.0",
  },
  traceExporter: new OTLPTraceExporter({
    url: "http://192.168.1.3:4318/v1/traces",
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Initialize the SDK
try {
  sdk.start();
  console.log("✅ OpenTelemetry tracing initialized");
} catch (error) {
  console.error("Error initializing tracing:", error);
}

// Add a simple process shutdown handler
process.on("SIGTERM", () => {
  try {
    sdk.shutdown();
    console.log("SDK shut down successfully");
  } catch (error) {
    console.error("Error shutting down SDK:", error);
  } finally {
    process.exit(0);
  }
});
