import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export type AgentOptions = {
  urls: string[];
  goal: string;
  stealth?: boolean;
  parallel?: boolean;
};

export type JsonOutput = {
  status: "success" | "failed" | "partial";
  data: any;
  screenshots: string[];
  logs: string[];
};

export class WebRuntimeAgentSdk {
  private apiKey: string;
  private apiBase: string;

  constructor() {
    this.apiKey = process.env.TINYFISH_API_KEY ?? "";
    this.apiBase = process.env.TINYFISH_API_BASE ?? "";
    if (!this.apiKey) throw new Error("Missing TINYFISH_API_KEY in .env");
  }

  async runAgents(options: AgentOptions): Promise<JsonOutput> {
    const { urls, goal, stealth = false, parallel = false } = options;

    const results: JsonOutput[] = [];
    const errors: string[] = [];

    const runSingle = async (url: string): Promise<JsonOutput> => {
      const res = await fetch(this.apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          url,
          goal,
          browser_profile: stealth ? "stealth" : "lite",
          proxy_config: stealth
            ? { enabled: true, country_code: "US" }
            : { enabled: false },
          feature_flags: { enable_agent_memory: true },
        }),
      });

      if (!res.ok) {
        return {
          status: "failed",
          data: null,
          screenshots: [],
          logs: [`HTTP ${res.status}: ${res.statusText}`],
        };
      }

      // Parse SSE stream into logs + final JSON
      const reader = res.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TransformStream({ transform: s, controller } => {
          // Split by SSE lines and emit JSON‑like events
          // This is a simplified sketch; you’d parse `data: ...` events
          const events = s.split("\n\n");
          for (const ev of events) {
            if (ev.startsWith("data:")) {
              const payload = ev.slice(5).trim();
              try {
                const j = JSON.parse(payload);
                controller.enqueue(j);
              } catch {}
            }
          }
        }))
        .getReader();

      let logs: string[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        logs.push(JSON.stringify(value));
      }

      // Simplified: assume last event is CompleteEvent with result_json
      const last = logs[logs.length - 1];
      let finalData;
      try {
        finalData = JSON.parse(last)?.result_json ?? {};
      } catch {
        finalData = {};
      }

      return {
        status: "success",
        data: finalData,
        screenshots: [], // TinyFish can return screenshots if you enable capture
        logs,
      };
    };

    try {
      if (parallel) {
        const proms = urls.map((u) => runSingle(u));
        const rs = await Promise.all(proms);
        return {
          status: "success",
          data: rs.map((r) => r.data),
          screenshots: rs.flatMap((r) => r.screenshots),
          logs: rs.flatMap((r) => r.logs),
        };
      } else {
        for (const url of urls) {
          const r = await runSingle(url);
          r.status === "success" ? results.push(r) : errors.push(r.logs.join("; "));
        }
        return {
          status: errors.length ? "partial" : "success",
          data: results.map((r) => r.data),
          screenshots: results.flatMap((r) => r.screenshots),
          logs: errors.length ? errors : results.flatMap((r) => r.logs),
        };
      }
    } catch (e) {
      const msg = String(e);
      return {
        status: "failed",
        data: null,
        screenshots: [],
        logs: [msg],
      };
    }
  }
}
