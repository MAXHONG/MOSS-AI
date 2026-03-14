"use client";

import {
  CalendarClockIcon,
  CheckCircle2Icon,
  FlagIcon,
  PackageCheckIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { useI18n } from "@/core/i18n/hooks";
import { cn } from "@/lib/utils";

import { AuroraText } from "../ui/aurora-text";

let waved = false;

export function Welcome({
  className,
  mode,
}: {
  className?: string;
  mode?: "ultra" | "pro" | "thinking" | "flash";
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const isUltra = useMemo(() => mode === "ultra", [mode]);
  const colors = useMemo(() => {
    if (isUltra) {
      return ["#efefbb", "#e9c665", "#e3a812"];
    }
    return ["var(--color-foreground)"];
  }, [isUltra]);
  const modeDescription = useMemo(() => {
    switch (mode) {
      case "thinking":
        return t.welcome.modeDescriptions.thinking;
      case "pro":
        return t.welcome.modeDescriptions.pro;
      case "ultra":
        return t.welcome.modeDescriptions.ultra;
      case "flash":
      default:
        return t.welcome.modeDescriptions.flash;
    }
  }, [mode, t.welcome.modeDescriptions]);

  useEffect(() => {
    waved = true;
  }, []);

  if (searchParams.get("mode") === "skill") {
    return (
      <div
        className={cn(
          "mx-auto flex w-full flex-col items-center justify-center gap-2 px-8 py-4 text-center",
          className,
        )}
      >
        <div className="text-2xl font-bold">✨ {t.welcome.createYourOwnSkill} ✨</div>
        <div className="text-muted-foreground text-sm">
          {t.welcome.createYourOwnSkillDescription.includes("\n") ? (
            <pre className="font-sans whitespace-pre">{t.welcome.createYourOwnSkillDescription}</pre>
          ) : (
            <p>{t.welcome.createYourOwnSkillDescription}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 py-4 text-center",
        className,
      )}
    >
      <div className="text-2xl font-bold">
        <div className="flex items-center gap-2">
          <div className={cn("inline-block", !waved ? "animate-wave" : "")}>
            {isUltra ? "🚀" : "👋"}
          </div>
          <AuroraText colors={colors}>{t.welcome.greeting}</AuroraText>
        </div>
      </div>

      <div className="text-muted-foreground max-w-2xl text-sm leading-6">
        {t.welcome.description.includes("\n") ? (
          <pre className="whitespace-pre-wrap font-sans">{t.welcome.description}</pre>
        ) : (
          <p>{t.welcome.description}</p>
        )}
      </div>

      <div className="grid w-full gap-3 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <div className="bg-background/70 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
              <SparklesIcon className="size-4" />
              {t.welcome.capabilityTitle}
            </div>
            <p className="text-muted-foreground mb-3 text-xs leading-5">
              {t.welcome.capabilitySubtitle}
            </p>
            <div className="space-y-2">
              {t.welcome.capabilityBullets.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-background/70 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-1 text-sm font-semibold">{t.welcome.cockpitTitle}</div>
            <p className="text-muted-foreground mb-3 text-xs leading-5">
              {t.welcome.cockpitSubtitle}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-dashed px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                  <FlagIcon className="size-3.5" />
                  {t.welcome.cockpitFields.mission}
                </div>
                <div className="text-muted-foreground text-xs leading-5">
                  Analyze the repo and redesign the product around an agent-first UX.
                </div>
              </div>
              <div className="rounded-xl border border-dashed px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                  <PackageCheckIcon className="size-3.5" />
                  {t.welcome.cockpitFields.deliverable}
                </div>
                <div className="text-muted-foreground text-xs leading-5">
                  A roadmap, updated interface, and working artifacts that can be reviewed.
                </div>
              </div>
              <div className="rounded-xl border border-dashed px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                  <ShieldAlertIcon className="size-3.5" />
                  {t.welcome.cockpitFields.constraints}
                </div>
                <div className="text-muted-foreground text-xs leading-5">
                  Keep changes auditable, avoid regressions, and respect the current architecture.
                </div>
              </div>
              <div className="rounded-xl border border-dashed px-3 py-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium">
                  <CalendarClockIcon className="size-3.5" />
                  {t.welcome.cockpitFields.deadline}
                </div>
                <div className="text-muted-foreground text-xs leading-5">
                  Define the decision horizon so the agent balances speed, depth, and scope.
                </div>
              </div>
            </div>
            <div className="bg-muted/60 mt-3 rounded-xl px-3 py-2 text-xs leading-5">
              {t.welcome.cockpitFooter}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-background/70 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-2 text-sm font-semibold">{t.welcome.suggestedTitle}</div>
            <div className="space-y-2 text-sm">
              {t.welcome.suggestedTasks.map((task) => (
                <div key={task} className="rounded-xl border border-dashed px-3 py-2 leading-5">
                  {task}
                </div>
              ))}
            </div>
            <div className="bg-muted/60 mt-3 rounded-xl px-3 py-2 text-xs leading-5">
              <span className="font-medium">{t.welcome.modeLabel}: </span>
              {modeDescription}
            </div>
          </div>

          <div className="bg-background/70 rounded-2xl border px-4 py-4 text-left shadow-sm backdrop-blur-sm">
            <div className="mb-2 text-sm font-semibold">
              {t.welcome.cockpitPresetsTitle}
            </div>
            <div className="space-y-2 text-sm">
              {t.welcome.cockpitPresets.map((task) => (
                <div key={task} className="bg-muted/50 rounded-xl px-3 py-2 leading-5">
                  {task}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
