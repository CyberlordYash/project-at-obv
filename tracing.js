const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} = require("@opentelemetry/sdk-trace-base");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const { Resource } = require("@opentelemetry/resources"); // ✅ Correct Import
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions"); // ✅ Needed for proper resource attributes

function initializeTracing() {
  const traceExporter = new OTLPTraceExporter({
    url: "http://127.0.0.1:4318/v1/traces", // Tempo OTLP HTTP endpoint
  });

  const sdk = new NodeSDK({
    traceExporter,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    resource: new Resource({
      // ✅ Fix: Use Resource correctly
      [SemanticResourceAttributes.SERVICE_NAME]: "express-tracing",
    }),
  });

  sdk
    .start()
    .then(() => console.log("✅ OpenTelemetry tracing initialized"))
    .catch((err) => console.error("❌ Error initializing tracing:", err));
}

module.exports = initializeTracing;
