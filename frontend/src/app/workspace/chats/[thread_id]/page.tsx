"use client";

import { ListChecksIcon, RouteIcon, TargetIcon } from "lucide-react";
import { useCallback, useMemo } from "react";

import { type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ArtifactTrigger } from "@/components/workspace/artifacts";
import {
  ChatBox,
  useSpecificChatMode,
  useThreadChat,
} from "@/components/workspace/chats";
import { InputBox } from "@/components/workspace/input-box";
import { MessageList } from "@/components/workspace/messages";
import { ThreadContext } from "@/components/workspace/messages/context";
import { ThreadTitle } from "@/components/workspace/thread-title";
import { TodoList } from "@/components/workspace/todo-list";
import { Tooltip } from "@/components/workspace/tooltip";
import { Welcome } from "@/components/workspace/welcome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/core/i18n/hooks";
import { useNotification } from "@/core/notification/hooks";
import { useLocalSettings } from "@/core/settings";
import { useThreadStream } from "@/core/threads/hooks";
import { textOfMessage } from "@/core/threads/utils";
import { env } from "@/env";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useLocalSettings();

  const { threadId, isNewThread, setIsNewThread, isMock } = useThreadChat();
  useSpecificChatMode();

  const { showNotification } = useNotification();

  const [thread, sendMessage] = useThreadStream({
    threadId: isNewThread ? undefined : threadId,
    context: settings.context,
    isMock,
    onStart: () => {
      setIsNewThread(false);
      history.replaceState(null, "", `/workspace/chats/${threadId}`);
    },
    onFinish: (state) => {
      if (document.hidden || !document.hasFocus()) {
        let body = "Conversation finished";
        const lastMessage = state.messages.at(-1);
        if (lastMessage) {
          const textContent = textOfMessage(lastMessage);
          if (textContent) {
            body =
              textContent.length > 200
                ? textContent.substring(0, 200) + "..."
                : textContent;
          }
        }
        showNotification(state.title, { body });
      }
    },
  });

  const timelineItems = useMemo(() => {
    const items: Array<{ label: string; tone: "neutral" | "success" | "running" }> = [];
    const todos = thread.values.todos ?? [];

    if (settings.context.mission?.trim()) {
      items.push({ label: settings.context.mission.trim(), tone: "neutral" });
    }

    if (todos.some((todo) => todo.status === "in_progress")) {
      items.push(
        ...todos
          .filter((todo) => todo.status === "in_progress")
          .slice(0, 2)
          .map((todo) => ({ label: todo.content, tone: "running" as const })),
      );
    }

    if ((thread.values.artifacts ?? []).length > 0) {
      items.push({
        label: `${(thread.values.artifacts ?? []).length} artifact(s) produced`,
        tone: "success",
      });
    }

    return items.slice(0, 4);
  }, [settings.context.mission, thread.values.artifacts, thread.values.todos]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      void sendMessage(threadId, message, {
        mission: settings.context.mission,
        deliverable: settings.context.deliverable,
        constraints: settings.context.constraints,
        deadline: settings.context.deadline,
        auto_route_model: settings.context.auto_route_model,
      });
    },
    [sendMessage, settings.context, threadId],
  );
  const handleStop = useCallback(async () => {
    await thread.stop();
  }, [thread]);

  return (
    <ThreadContext.Provider value={{ thread, isMock }}>
      <ChatBox threadId={threadId}>
        <div className="relative flex size-full min-h-0 justify-between">
          <header
            className={cn(
              "absolute top-0 right-0 left-0 z-30 flex h-12 shrink-0 items-center px-4",
              isNewThread
                ? "bg-background/0 backdrop-blur-none"
                : "bg-background/80 shadow-xs backdrop-blur",
            )}
          >
            <div className="flex w-full items-center text-sm font-medium">
              <ThreadTitle threadId={threadId} thread={thread} />
            </div>
            <div>
              <ArtifactTrigger />
            </div>
          </header>
          <main className="flex min-h-0 max-w-full grow flex-col">
            <div className="flex size-full justify-center">
              <MessageList
                className={cn("size-full", !isNewThread && "pt-10")}
                threadId={threadId}
                thread={thread}
              />
            </div>
            <div className="absolute right-0 bottom-0 left-0 z-30 flex justify-center px-4">
              <div
                className={cn(
                  "relative w-full",
                  isNewThread && "-translate-y-[calc(50vh-96px)]",
                  isNewThread
                    ? "max-w-(--container-width-sm)"
                    : "max-w-(--container-width-md)",
                )}
              >
                <div className="absolute -top-4 right-0 left-0 z-0">
                  <div className="absolute right-0 bottom-0 left-0">
                    <TodoList
                      className="bg-background/5"
                      todos={thread.values.todos ?? []}
                      hidden={
                        !thread.values.todos || thread.values.todos.length === 0
                      }
                    />
                  </div>
                </div>
                {isNewThread && (
                  <div className="bg-background/80 border-border/60 absolute -top-[25.5rem] left-0 right-0 z-20 rounded-2xl border p-4 shadow-sm backdrop-blur-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {t.welcome.missionPanelTitle}
                        </div>
                        <div className="text-muted-foreground mt-1 text-xs leading-5">
                          {t.welcome.missionPanelDescription}
                        </div>
                      </div>
                      <Tooltip content={t.welcome.routeModelDescription}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 text-xs"
                          onClick={() =>
                            setSettings("context", {
                              auto_route_model: !settings.context.auto_route_model,
                            })
                          }
                        >
                          <RouteIcon className="size-3.5" />
                          {settings.context.auto_route_model
                            ? t.inputBox.autoRouteOn
                            : t.inputBox.autoRouteOff}
                        </Button>
                      </Tooltip>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {t.welcome.cockpitFields.mission}
                        </div>
                        <Textarea
                          value={settings.context.mission ?? ""}
                          onChange={(e) =>
                            setSettings("context", { mission: e.target.value })
                          }
                          placeholder={t.welcome.missionFieldHint}
                          className="min-h-24 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {t.welcome.cockpitFields.deliverable}
                        </div>
                        <Textarea
                          value={settings.context.deliverable ?? ""}
                          onChange={(e) =>
                            setSettings("context", { deliverable: e.target.value })
                          }
                          placeholder={t.welcome.deliverableFieldHint}
                          className="min-h-24 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {t.welcome.cockpitFields.constraints}
                        </div>
                        <Textarea
                          value={settings.context.constraints ?? ""}
                          onChange={(e) =>
                            setSettings("context", { constraints: e.target.value })
                          }
                          placeholder={t.welcome.constraintsFieldHint}
                          className="min-h-20 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {t.welcome.cockpitFields.deadline}
                        </div>
                        <Textarea
                          value={settings.context.deadline ?? ""}
                          onChange={(e) =>
                            setSettings("context", { deadline: e.target.value })
                          }
                          placeholder={t.welcome.deadlineFieldHint}
                          className="min-h-20 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                        <TargetIcon className="size-3.5" />
                        {t.welcome.missionExamplesTitle}
                      </div>
                      <div className="space-y-1.5">
                        {t.welcome.cockpitPresets.map((example) => (
                          <div key={example}>{example}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <InputBox
                  className={cn("bg-background/5 w-full -translate-y-4")}
                  isNewThread={isNewThread}
                  threadId={threadId}
                  autoFocus={isNewThread}
                  status={thread.isLoading ? "streaming" : "ready"}
                  context={settings.context}
                  extraHeader={
                    isNewThread && <Welcome mode={settings.context.mode} />
                  }
                  disabled={env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true"}
                  onContextChange={(context) => setSettings("context", context)}
                  onSubmit={handleSubmit}
                  onStop={handleStop}
                />
                {!isNewThread && timelineItems.length > 0 && (
                  <div className="absolute -top-24 left-0 right-0 z-10 flex justify-center px-4">
                    <div className="bg-background/85 border-border/60 flex w-full max-w-(--container-width-md) items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-sm">
                      <div className="mt-0.5 rounded-full bg-muted p-2">
                        <ListChecksIcon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Execution Timeline
                        </div>
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          {timelineItems.map((item, index) => (
                            <div
                              key={`${item.label}-${index}`}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs leading-5",
                                item.tone === "success" &&
                                  "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30",
                                item.tone === "running" &&
                                  "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30",
                              )}
                            >
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true" && (
                  <div className="text-muted-foreground/67 w-full translate-y-12 text-center text-xs">
                    {t.common.notAvailableInDemoMode}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </ChatBox>
    </ThreadContext.Provider>
  );
}
