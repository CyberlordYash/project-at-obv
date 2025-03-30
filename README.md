# Monitoring Stack (Prometheus, Grafana, Loki, Tempo) for a Noisy Node.js Application

This project sets up a monitoring stack using Docker Compose to observe a Node.js application that simulates random errors and high latency. It leverages Prometheus for metrics, Grafana for visualization, Loki for logs, and Tempo for traces.

## Project Structure
 ```bash
.
├── docker-compose.yml        # Docker Compose configuration
├── prometheus-config.yml     # Prometheus configuration
├── tempo-config.yml          # Tempo configuration
├── grafana-data/             # Grafana persistent data volume
└── README.md                 # This README file
```
## Prerequisites

* Docker and Docker Compose installed.

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2.  **Start the services:**

    ```bash
    docker-compose up -d
    ```

    This command will start the Prometheus, Grafana, Loki, and Tempo containers in detached mode.

3.  **Access Grafana:**

    Open your web browser and navigate to `http://localhost:4000`. Log in with the default credentials:

    * Username: `admin`
    * Password: `admin`

    **Important:** Change the default password immediately after logging in.

4.  **Configure Prometheus Data Source in Grafana:**

    * In Grafana, go to "Configuration" (gear icon) -> "Data Sources".
    * Click "Add data source" and select "Prometheus".
    * Set the URL to `http://prom-server:9090`.
    * Click "Save & test".

5.  **Configure Loki Data Source in Grafana:**

    * In Grafana, go to "Configuration" (gear icon) -> "Data Sources".
    * Click "Add data source" and select "Loki".
    * Set the URL to `http://loki:3100`.
    * Click "Save & test".

6.  **Configure Tempo Data Source in Grafana:**

    * In Grafana, go to "Configuration" (gear icon) -> "Data Sources".
    * Click "Add data source" and select "Tempo".
    * Set the URL to `http://tempo:3200`.
    * Click "Save & test".

7.  **Import Grafana Dashboards:**

    You will need to import dashboards to visualize the data. Create your own, or import the ones from the internet. Example dashboards for Nodejs, Loki, Tempo and Prometheus can be found on the grafana website.

8.  **Node.js Application (Simulation):**

    This setup expects a Node.js application that exposes Prometheus metrics, logs, and tracing information. You need to create a nodejs application that will randomly throw errors and cause latency. You will also need to instrument your code with promethues, Loki and Tempo.

    Example of a simple express server with prometheus instrumentation.
    ```javascript
    const express = require('express');
    const client = require('prom-client');

    const app = express();
    const port = 3000;

    const httpRequestDurationMicroseconds = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in microseconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    client.register.registerMetric(httpRequestDurationMicroseconds);

    app.get('/api/data', (req, res) => {
      const start = Date.now();
      const random = Math.random();

      if (random < 0.2) {
        setTimeout(() => {
          res.status(500).send('Internal Server Error');
          httpRequestDurationMicroseconds.observe((Date.now() - start) / 1000, {
            method: req.method,
            route: req.path,
            status_code: 500,
          });
        }, Math.random() * 2000);
      } else if (random < 0.5) {
        setTimeout(() => {
          res.send('Data with latency');
          httpRequestDurationMicroseconds.observe((Date.now() - start) / 1000, {
            method: req.method,
            route: req.path,
            status_code: 200,
          });
        }, Math.random() * 5000);
      } else {
        res.send('Normal data');
        httpRequestDurationMicroseconds.observe((Date.now() - start) / 1000, {
          method: req.method,
          route: req.path,
          status_code: 200,
        });
      }
    });

    app.get('/metrics', async (req, res) => {
      res.setHeader('Content-Type', client.register.contentType);
      res.send(await client.register.metrics());
    });

    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
    ```
    And then add Loki and Tempo instrumentation as well.
    Ensure that this application is reachable by the Prometheus, Loki, and Tempo containers.

9.  **View Metrics, Logs, and Traces in Grafana:**

    Use the configured Grafana dashboards to monitor the Node.js application's performance, logs, and traces. You can observe the random errors and latency spikes.

## Configuration Files

* **`prometheus-config.yml`:** Configures Prometheus to scrape metrics from the Node.js application.
* **`tempo-config.yml`:** Configures Tempo.

## Cleaning Up

To stop and remove the containers:

```bash
docker-compose down
