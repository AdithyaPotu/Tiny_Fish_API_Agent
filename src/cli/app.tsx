import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

type Run = {
  id: string;
  urls: string[];
  goal: string;
  status: "pending" | "running" | "success" | "failed";
  data: any;
  logs: string[];
  createdAt: string;
};

export default function App() {
  const [runs, setRuns] = useState<Run[]>([]);

  const startRun = async () => {
    const payload = {
      urls: ["https://example.com"],
      goal: "Extract products under $100",
      stealth: true,
      parallel: false,
    };

    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const run = await res.json();
    setRuns((prev) => [run, ...prev]);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Web Runtime Agent Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={startRun}>New Run</Button>
          <div className="mt-4 space-y-4">
            {runs.map((r) => (
              <Card key={r.id} className="p-4">
                <p>
                  <strong>Status:</strong> {r.status}
                </p>
                <p>
                  <strong>URLs:</strong> {r.urls.join(", ")}
                </p>
                <pre className="mt-2 text-xs bg-gray-100 p-2">
                  {JSON.stringify(r.data, null, 2)}
                </pre>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
