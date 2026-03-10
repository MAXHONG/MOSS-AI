"use client";

import { useEffect, useState } from "react";
import { env } from "@/env";
import { RefreshCwIcon, ContainerIcon } from "lucide-react";

interface DockerStatus {
  running: boolean;
  version: string;
  containers: number;
  images: number;
  memory_usage: number;
}

async function fetchDockerStatus(token: string): Promise<DockerStatus> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/docker/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Docker status");
  }
  return response.json();
}

async function fetchDockerImages(token: string): Promise<string[]> {
  const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_BASE_URL || ""}/api/admin/docker/images`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Docker images");
  }
  return response.json();
}

export default function AdminDockerPage() {
  const [status, setStatus] = useState<DockerStatus | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";

  const loadData = async () => {
    try {
      const [statusData, imagesData] = await Promise.all([
        fetchDockerStatus(token),
        fetchDockerImages(token),
      ]);
      setStatus(statusData);
      setImages(imagesData);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Docker status");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold">Docker Management</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-muted disabled:opacity-50"
        >
          <RefreshCwIcon className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Status Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <div
              className={`size-3 rounded-full ${
                status?.running ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{status?.running ? "Running" : "Stopped"}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Version</div>
          <div className="mt-2 text-2xl font-bold">{status?.version || "N/A"}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Containers</div>
          <div className="mt-2 text-2xl font-bold">{status?.containers || 0}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Images</div>
          <div className="mt-2 text-2xl font-bold">{status?.images || 0}</div>
        </div>
      </div>

      {/* Images List */}
      <div className="rounded-lg border">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Docker Images</h2>
        </div>
        <div className="divide-y">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div key={index} className="flex items-center gap-4 px-6 py-3">
                <ContainerIcon className="size-5 text-muted-foreground" />
                <span className="font-mono text-sm">{image}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-muted-foreground">No images found</div>
          )}
        </div>
      </div>
    </div>
  );
}
