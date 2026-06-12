"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Bot, Send, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Pourquoi les ventes ont baissé cette semaine ?",
  "Quel produit dois-je promouvoir la semaine prochaine ?",
  "Quels magasins sont en difficulté ?",
  "Prépare un plan d'action pour augmenter les ventes de 10%.",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const reply = await api.assistant(question);
      setMessages((m) => [...m, { role: "assistant", text: reply.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e instanceof Error ? e.message : "Erreur." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col p-6 lg:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Assistant IA</h1>
        <p className="text-sm text-slate-500">Posez vos questions commerciales en langage naturel.</p>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="h-12 w-12 text-brand-600" />
              <p className="mt-3 text-slate-500">Comment puis-je vous aider aujourd'hui ?</p>
              <div className="mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="btn-ghost text-left text-sm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div className={`max-w-2xl whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                {m.text}
              </div>
              {m.role === "user" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-slate-600">
                  <User className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
          {loading && <p className="text-sm text-slate-400">L'assistant réfléchit…</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-slate-200 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre question…"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
