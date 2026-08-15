const http = require("http");
const endpoints = ["/", "/login", "/api/users"];

function get(path) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: "localhost", port: 8000, path, timeout: 3000 },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () =>
          resolve({ path, status: res.statusCode, body: body.slice(0, 800) }),
        );
      },
    );
    req.on("error", (e) => resolve({ path, error: e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ path, error: "timeout" });
    });
  });
}

(async () => {
  for (const p of endpoints) {
    const r = await get(p);
    if (r.error) console.log(`--- ${r.path} ERROR: ${r.error}`);
    else console.log(`--- ${r.path} ${r.status}\n${r.body}\n`);
  }
})();
