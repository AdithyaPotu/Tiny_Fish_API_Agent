import { Command } from "commander";
import dotenv from "dotenv";
import { WebRuntimeAgentSdk } from "../sdk/tinyfish-sdk";

dotenv.config();

const program = new Command();

program
  .name("web-runtime-agent")
  .description("Run AI web agents on live sites via TinyFish");

program
  .command("run")
  .description("Run a multi‑site web agent in streaming mode")
  .argument(
    "<urls>",
    'Space‑delimited URLs, e.g., "https://site1.com https://site2.com"'
  )
  .argument(
    "<goal>",
    'Natural‑language goal, e.g., "Extract products under $100"'
  )
  .option(
    "-s, --stealth",
    "Enable stealth / anti‑detection mode (Cloudflare/CAPTCHA)",
    false
  )
  .option(
    "-p, --parallel",
    "Run sites in parallel (multi‑site execution)",
    false
  )
  .option(
    "-j, --json",
    "Output raw JSON result (default: pretty‑printed)",
    false
  )
  .action(async (urlsStr: string, goal: string, opts) => {
    const urls = urlsStr.trim().split(/\s+/).filter(Boolean);
    const sdk = new WebRuntimeAgentSdk();

    const result = await sdk.runAgents({
      urls,
      goal,
      stealth: opts.stealth,
      parallel: opts.parallel,
    });

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }
  });

program.parse();
