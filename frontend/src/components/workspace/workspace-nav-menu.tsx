"use client";

import {
  BugIcon,
  ChevronsUpDown,
  GlobeIcon,
  InfoIcon,
  LogOutIcon,
  MailIcon,
  Settings2Icon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/core/auth";
import { useI18n } from "@/core/i18n/hooks";

import { GithubIcon } from "./github-icon";
import { SettingsDialog } from "./settings";

function NavMenuButtonContent({
  isSidebarOpen,
  t,
  user,
}: {
  isSidebarOpen: boolean;
  t: ReturnType<typeof useI18n>["t"];
  user: { username: string; role: string } | null;
}) {
  // User is logged in - show user info
  if (user) {
    return isSidebarOpen ? (
      <div className="flex w-full items-center gap-2 text-left">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{user.username}</span>
          <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
        </div>
        <ChevronsUpDown className="text-muted-foreground ml-auto size-4" />
      </div>
    ) : (
      <div className="flex size-full items-center justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {user.username.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  // User not logged in - show settings
  return isSidebarOpen ? (
    <div className="text-muted-foreground flex w-full items-center gap-2 text-left text-sm">
      <SettingsIcon className="size-4" />
      <span>{t.workspace.settingsAndMore}</span>
      <ChevronsUpDown className="text-muted-foreground ml-auto size-4" />
    </div>
  ) : (
    <div className="flex size-full items-center justify-center">
      <SettingsIcon className="text-muted-foreground size-4" />
    </div>
  );
}

export function WorkspaceNavMenu() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDefaultSection, setSettingsDefaultSection] = useState<
    "appearance" | "memory" | "tools" | "skills" | "notification" | "about"
  >("appearance");
  const [mounted, setMounted] = useState(false);
  const { open: isSidebarOpen } = useSidebar();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        defaultSection={settingsDefaultSection}
      />
      <SidebarMenu className="w-full">
        <SidebarMenuItem>
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <NavMenuButtonContent isSidebarOpen={isSidebarOpen} t={t} user={user} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="end"
                sideOffset={4}
              >
                {user ? (
                  <>
                    <div className="px-2 py-1.5">
                      <div className="text-sm font-medium">{user.username}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                ) : null}

                <DropdownMenuGroup>
                  {user && (
                    <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                      <UserIcon />
                      Profile
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsDefaultSection("appearance");
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings2Icon />
                    {t.common.settings}
                  </DropdownMenuItem>

                  {user && user.role === "admin" && (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <ShieldIcon />
                      Admin Panel
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <a
                    href="https://deerflow.tech/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DropdownMenuItem>
                      <GlobeIcon />
                      {t.workspace.officialWebsite}
                    </DropdownMenuItem>
                  </a>
                  <a
                    href="https://github.com/MAXHONG/MOSS-AI"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DropdownMenuItem>
                      <GithubIcon />
                      {t.workspace.visitGithub}
                    </DropdownMenuItem>
                  </a>
                  <DropdownMenuSeparator />
                  <a
                    href="https://github.com/MAXHONG/MOSS-AI/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DropdownMenuItem>
                      <BugIcon />
                      {t.workspace.reportIssue}
                    </DropdownMenuItem>
                  </a>
                  <a href="mailto:support@deerflow.tech">
                    <DropdownMenuItem>
                      <MailIcon />
                      {t.workspace.contactUs}
                    </DropdownMenuItem>
                  </a>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSettingsDefaultSection("about");
                    setSettingsOpen(true);
                  }}
                >
                  <InfoIcon />
                  {t.workspace.about}
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOutIcon />
                      Logout
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <NavMenuButtonContent isSidebarOpen={isSidebarOpen} t={t} user={user} />
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
