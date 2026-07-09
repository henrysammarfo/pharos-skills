#!/usr/bin/env node
/**
 * CLI: full trust stack status for one agent address.
 * Usage: node scripts/status.mjs 0xAgentAddress
 */
import { handleRequest } from "./handler.mjs";

const agent = process.argv[2];
if (!agent) {
  console.error("Usage: node scripts/status.mjs <agentAddress>");
  process.exit(1);
}

const result = await handleRequest({
  task: "full stack status",
  agent,
});
console.log(JSON.stringify(result, null, 2));
