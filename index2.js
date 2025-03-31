const express = require("express");
const app = express();
const port = 5000;

// Simulated external service with artificial delay
app.get("/external-service", (req, res) => {
  const randomTime = Math.floor(Math.random() * 10000); // Delay up to 10s
  console.log(`External service delaying response for ${randomTime}ms`);

  //   setTimeout(() => {
  res.send("Response from slow external service");
  //   }, randomTime);
});

// Start the external service
app.listen(port, () => {
  console.log(`External service running on http://localhost:${port}`);
});
