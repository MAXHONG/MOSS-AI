"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/core/auth";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/admin");
      return;
    }

    if (user?.role !== "admin") {
      router.push("/?error=admin_required");
      return;
    }

    setChecked(true);
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading || !checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Redirect to users page after auth check
  router.push("/admin/users");
  return null;
}
