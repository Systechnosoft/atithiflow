import http from "http";

const url = "http://127.0.0.1:3000/healthz";
const timeoutMs = 5000;

const request = http.get(url, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode !== 200) {
      console.error(`[ERROR] Healthcheck failed: status code ${res.statusCode}`);
      process.exit(1);
    }

    try {
      const payload = JSON.parse(data);
      if (payload.status !== "ok") {
        console.error(`[ERROR] Healthcheck failed: invalid payload status ${payload.status}`);
        process.exit(1);
      }

      console.log("[SUCCESS] Application health endpoint is ready.");
      process.exit(0);
    } catch (error) {
      console.error("[ERROR] Healthcheck failed: invalid JSON response.");
      process.exit(1);
    }
  });
});

request.on("error", (error) => {
  console.error(`[ERROR] Healthcheck request failed: ${error.message}`);
  process.exit(1);
});

request.setTimeout(timeoutMs, () => {
  console.error("[ERROR] Healthcheck timed out.");
  request.destroy();
  process.exit(1);
});
