"use client";

import { useEffect, useState } from "react";
import { env } from "@/env";

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user_id: string | null;
  username: string | null;
  ip_address: string | null;
  resource: string | null;
  details: Record<string, unknown>;
  status: string;
}

interface AuditStats {
  total_logs: number;
  login_count: number;
  user_actions: number;
  failed_logins: number;
  actions_by_type: Record<string, number>;
}

async function fetchAuditLogs(token: string): Promise<AuditLog[]> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/audit/logs?limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch audit logs");
  }
  return response.json();
}

async function fetchAuditStats(token: string): Promise<AuditStats> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/audit/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch audit stats");
  }
  return response.json();
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"logs" | "stats">("logs");

  // Get token from localStorage (simplified)
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";

  useEffect(() => {
    Promise.all([fetchAuditLogs(token), fetchAuditStats(token)])
      .then(([logsData, statsData]) => {
        setLogs(logsData);
        setStats(statsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
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
      <h1 className="mb-6 font-serif text-2xl font-bold">Audit Logs</h1>

      {/* Tabs */}
      <div className="mb-6 flex border-b">
        <button
          onClick={() => setActiveTab("logs")}
          className={`mr-4 border-b-2 px-4 py-2 ${
            activeTab === "logs"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`border-b-2 px-4 py-2 ${
            activeTab === "stats"
              ? "border-primary font-medium"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Statistics
        </button>
      </div>

      {activeTab === "stats" && stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{stats.total_logs}</div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{stats.login_count}</div>
            <div className="text-sm text-muted-foreground">Login Count</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{stats.user_actions}</div>
            <div className="text-sm text-muted-foreground">User Actions</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed_logins}</div>
            <div className="text-sm text-muted-foreground">Failed Logins</div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{log.username || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{log.ip_address || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{log.resource || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No audit logs found</div>
          )}
        </div>
      )}
    </div>
  );
}
