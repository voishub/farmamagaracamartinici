import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useSite } from "@/lib/site-content";
import logo from "@/assets/donkey-logo.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";

const copy = {
  sr: {
    title: "Asistent za mlijeko",
    sub: "Pitajte o upotrebi magarećeg mlijeka",
    empty: "Zdravo! Pitajte me bilo šta o magarećem mlijeku.",
    placeholder: "Npr. Kako se koristi za kožu?",
    thinking: "Razmišljam...",
    suggestions: ["Kako čuvati mlijeko?", "Koliko piti dnevno?", "Da li je dobro za djecu?"],
  },
  en: {
    title: "Milk assistant",
    sub: "Ask about using donkey milk",
    empty: "Hello! Ask me anything about donkey milk.",
    placeholder: "E.g. How is it used for skin?",
    thinking: "Thinking...",
    suggestions: ["How to store the milk?", "How much per day?", "Is it good for kids?"],
  },
};

export function ChatWidget() {
  const { lang, chatOpen, setChatOpen } = useSite();
  const c = copy[lang];
  const langRef = useRef(lang);
  langRef.current = lang;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => ({ lang: langRef.current }) }),
    [],
  );
  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
    onError: (err) => {
      const m = err.message || "";
      if (m.includes("429")) toast.error(lang === "sr" ? "Previše zahtjeva, pokušajte kasnije." : "Too many requests, try later.");
      else if (m.includes("402")) toast.error(lang === "sr" ? "AI krediti su potrošeni." : "AI credits exhausted.");
      else toast.error(m || "Error");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (chatOpen && !busy) textareaRef.current?.focus();
  }, [chatOpen, busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    sendMessage({ text });
  };

  return (
    <>
      {!chatOpen && (
        <Button
          variant="hero"
          size="lg"
          className="fixed bottom-6 right-6 z-40 h-14 gap-2 pl-2 pr-5"
          onClick={() => setChatOpen(true)}
        >
          <img src={logo} alt="" className="size-10 rounded-full bg-card p-1" width={40} height={40} />
          <MessageCircle className="size-4" />
          {c.title}
        </Button>
      )}
      {chatOpen && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,85vh)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]">
          <div className="flex items-center gap-3 border-b bg-secondary px-4 py-3">
            <img src={logo} alt="" className="size-10 rounded-full bg-card p-1" width={40} height={40} />
            <div className="flex-1">
              <p className="font-display text-base font-semibold leading-tight">{c.title}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
            <Button size="icon-sm" variant="ghost" onClick={() => setChatOpen(false)} aria-label="Close">
              <X />
            </Button>
          </div>
          <Conversation className="flex-1">
            <ConversationContent className="gap-5">
              {messages.length === 0 ? (
                <ConversationEmptyState>
                  <img src={logo} alt="" className="size-20" width={80} height={80} />
                  <p className="font-display text-lg">{c.empty}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {c.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </ConversationEmptyState>
              ) : (
                messages.map((m) => (
                  <Message key={m.id} from={m.role}>
                    <MessageContent
                      className={
                        m.role === "user"
                          ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                          : undefined
                      }
                    >
                      {m.parts.map((p, i) =>
                        p.type === "text" ? (
                          m.role === "assistant" ? (
                            <MessageResponse key={i}>{p.text}</MessageResponse>
                          ) : (
                            <span key={i} className="whitespace-pre-wrap">{p.text}</span>
                          )
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "error" && error && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {error.message || (lang === "sr" ? "Greška asistenta." : "Assistant error.")}
                </p>
              )}
              {status === "submitted" && <Shimmer className="text-sm">{c.thinking}</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="border-t p-3">
            <PromptInput onSubmit={(msg) => send(msg.text)}>
              <PromptInputTextarea ref={textareaRef} placeholder={c.placeholder} />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
