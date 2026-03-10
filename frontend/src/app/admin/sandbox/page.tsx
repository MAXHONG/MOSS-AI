"use client";

import { useEffect, useState } from "react";
import { env } from "@/env";

interface SandboxConfig {
  use: string;
  image: string;
  port: number;
  auto_start: boolean;
  idle_timeout: number;
}

async function fetchSandboxConfig(token: string): Promise<SandboxConfig> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/sandbox/config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch sandbox config");
  }
  return response.json();
}

async function updateSandboxConfig(token: string, config: SandboxConfig): Promise<void> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/sandbox/config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error("Failed to update sandbox config");
  }
}

export default function AdminSandboxPage() {
  const [config, setConfig] = useState<SandboxConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";

  useEffect(() => {
    fetchSandboxConfig(token)
      .then(setConfig)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateSandboxConfig(token, config);
      setSuccess("Configuration saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold">Sandbox Configuration</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Sandbox Provider</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Provider Type</label>
              <select
                value={config?.use || ""}
                onChange={(e) => setConfig({ ...config!, use: e.target.value })}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="src.community.aio_sandbox:AioSandboxProvider">Docker (AIO)</option>
                <option value="src.sandbox.local:LocalSandboxProvider">Local</option>
                <option value="src.community.aio_sandbox:RemoteSandboxProvider">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Docker Image</label>
              <input
                type="text"
                value={config?.image || ""}
                onChange={(e) => setConfig({ ...config!, image: e.target.value })}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Base Port</label>
              <input
                type="number"
                value={config?.port || 0}
                onChange={(e) => setConfig({ ...config!, port: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto_start"
                checked={config?.auto_start || false}
                onChange={(e) => setConfig({ ...config!, auto_start: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="auto_start" className="text-sm font-medium">
                Auto Start Container
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium">Idle Timeout (seconds)</label>
              <input
                type="number"
                value={config?.idle_timeout || 600}
                onChange={(e) => setConfig({ ...config!, idle_timeout: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
