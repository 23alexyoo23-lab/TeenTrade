"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (message: string, options?: { tone?: ToastMessage["tone"]; action?: ToastAction }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback<ToastContextValue["toast"]>((message, options) => {
    const id = nextId++;
    setMessages((current) => [...current, { id, message, tone: options?.tone ?? "success", action: options?.action }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((m) => m.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // 13.2 — toast content is announced to assistive technology.
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "min(480px, calc(100vw - 32px))",
        }}
      >
        {messages.map((message) => (
          <ToastItem key={message.id} message={message} onDismiss={() => dismiss(message.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, message.action ? 8000 : 5000);
    return () => window.clearTimeout(timer);
  }, [message.action, onDismiss]);

  const tone = {
    success: { bg: "var(--ink)", fg: "#fff", icon: "check-circle" as const },
    error: { bg: "var(--red)", fg: "#fff", icon: "alert-triangle" as const },
    info: { bg: "var(--blue-primary)", fg: "#fff", icon: "info" as const },
  }[message.tone];

  return (
    <div
      style={{
        background: tone.bg,
        color: tone.fg,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Icon name={tone.icon} size={18} />
      <span className="t-body-md" style={{ flex: 1 }}>
        {message.message}
      </span>
      {message.action ? (
        <button
          type="button"
          onClick={() => {
            message.action?.onClick();
            onDismiss();
          }}
          className="t-body-md"
          style={{
            background: "transparent",
            border: 0,
            color: "inherit",
            textDecoration: "underline",
            cursor: "pointer",
            padding: "4px 6px",
          }}
        >
          {message.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer", display: "flex", padding: 4 }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
