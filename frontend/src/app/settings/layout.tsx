"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon, ShieldIcon, KeyIcon, BellIcon } from "lucide-react";

const settingsNav = [
  { href: "/settings/profile", label: "Profile", icon: UserIcon },
  { href: "/settings/security", label: "Security", icon: KeyIcon },
  { href: "/settings/notifications", label: "Notifications", icon: BellIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar p-4">
        <h2 className="mb-4 px-2 text-lg font-semibold">Settings</h2>
        <nav className="space-y-1">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent ${
                pathname === item.href ? "bg-sidebar-accent" : ""
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
