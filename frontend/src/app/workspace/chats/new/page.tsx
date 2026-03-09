"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getAPIClient } from "@/core/api";

export default function NewChatPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const createThreadAndRedirect = useCallback(async () => {
    try {
      const client = getAPIClient(false);
      // Create a new thread
      const thread = await client.threads.create({});
      if (isMounted.current && thread.thread_id) {
        router.replace(`/workspace/chats/${thread.thread_id}`);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Failed to create chat");
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    isMounted.current = true;
    createThreadAndRedirect();

    return () => {
      isMounted.current = false;
    };
  }, [createThreadAndRedirect]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500">Error: {error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              createThreadAndRedirect();
            }}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Creating new chat...</p>
      </div>
    </div>
  );
}
