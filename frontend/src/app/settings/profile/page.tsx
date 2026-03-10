"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/core/auth";
import { UserIcon, MailIcon, ShieldIcon, CalendarIcon } from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Please login to view your profile</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">User Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-lg border">
        <div className="flex items-center gap-4 border-b p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="flex items-center gap-1 text-sm text-muted-foreground capitalize">
              <ShieldIcon className="size-4" />
              {user.role}
            </p>
          </div>
        </div>

        <div className="divide-y">
          <div className="flex items-center gap-3 px-6 py-4">
            <UserIcon className="size-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Username</div>
              <div className="text-sm text-muted-foreground">{user.username}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <MailIcon className="size-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user.email || "Not set"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <CalendarIcon className="size-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Created</div>
              <div className="text-sm text-muted-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">Account Actions</h3>
        <div className="space-y-2">
          <button className="w-full rounded-md border px-4 py-2 text-left hover:bg-muted">
            Change Password
          </button>
          <button className="w-full rounded-md border px-4 py-2 text-left hover:bg-muted">
            Update Email
          </button>
          <button className="w-full rounded-md border border-red-200 px-4 py-2 text-left text-red-600 hover:bg-red-50">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
