import { createServer } from "http";
import { readFileSync } from "fs";

const PORT = process.env.X402_PORT || 4020;
const dep = JSON.parse(readFileSync("deployments.json", "utf8"));

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/api/premium" && req.method === "GET") {
    const paymentSig = req.headers["payment-signature"];
    if (!paymentSig) {
      const body = Buffer.from(
        JSON.stringify({
          scheme: "exact",
          network: "pharos-atlantic",
          chainId: 688689,
          asset: "PHRS",
          amount: "1000000000000000",
          payTo: dep.deployer,
        })
      ).toString("base64");
      res.writeHead(402, {
        "Content-Type": "application/json",
        "PAYMENT-REQUIRED": body,
      });
      return res.end(JSON.stringify({ error: "Payment required", x402: true }));
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
      "PAYMENT-RESPONSE": Buffer.from(JSON.stringify({ verified: true })).toString("base64"),
    });
    return res.end(JSON.stringify({
      data: "Premium agent intelligence feed",
      network: "Pharos Atlantic",
      skills: Object.keys(dep.contracts),
    }));
  }

  if (url.pathname === "/health") {
    return res.end(JSON.stringify({ ok: true, contracts: dep.contracts }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`x402 HTTP server: http://localhost:${PORT}/api/premium`);
});
