"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/core/auth";

import {
  ShieldIcon,
  UsersIcon,
  SettingsIcon,
  ActivityIcon,
  ContainerIcon,
  GitBranchIcon,
  LogOutIcon,
  LayoutDashboardIcon,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/audit", label: "Audit Logs", icon: ActivityIcon },
  { href: "/admin/sandbox", label: "Sandbox", icon: SettingsIcon },
  { href: "/admin/docker", label: "Docker", icon: ContainerIcon },
  { href: "/admin/git", label: "Git", icon: GitBranchIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=" + pathname);
      return;
    }

    if (user?.role !== "admin") {
      router.push("/?error=admin_required");
      return;
    }

    setChecked(true);
  }, [user, isLoading, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar">
        <div className="flex h-14 items-center border-b px-4">
          <ShieldIcon className="mr-2 size-5" />
          <span className="font-semibold">Admin Panel</span>
        </div>

        <nav className="p-2">
          <Link
            href="/admin"
            className={`flex items-center rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${
              pathname === "/admin" ? "bg-sidebar-accent" : ""
            }`}
          >
            <LayoutDashboardIcon className="mr-2 size-4" />
            Dashboard
          </Link>

          <div className="mt-4 px-3 text-xs font-medium text-muted-foreground">
            Management
          </div>

          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mt-1 flex items-center rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${
                pathname === item.href ? "bg-sidebar-accent" : ""
              }`}
            >
              <item.icon className="mr-2 size-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-14 w-64 border-t p-2">
          <div className="mb-2 flex items-center px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2">
              <div className="text-sm font-medium">{user?.username}</div>
              <div className="text-xs text-muted-foreground capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOutIcon className="mr-2 size-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
