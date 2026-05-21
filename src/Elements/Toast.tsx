import '../style/Toast.css';

import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

// ─── types ────────────────────────────────────────────────────────────────────

type ToastFunction = (message: string, type?: string) => void;

interface Toast {
  id: number;
  message: string;
  type: string;
  duration: number;
}

interface ToastProviderProps {
  children: ReactNode;
  duration?: number;
}

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

interface ToastItemProps {
  message: string;
  type: string;
  duration: number;
  onDismiss: () => void;
}

// ─── config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG = {
  noicon: {
    icon: (<></>)
  },
  info: {
    icon: (
      <span className="toast-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      </span>
    ),
  },
  error: {
    icon: (
      <span className="toast-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      </span>
    ),
  },
};

// ─── context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastFunction | null>(null);

export function ToastProvider({ children, duration = 3500 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function toast(message: string, type = "info") {
    const id = Date.now() + Math.random(); // safe for rapid-fire calls
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Call this hook in any component inside <ToastProvider>.
 * Returns a function: toast(message, type)
 *
 * @example
 * const toast = useToast();
 * toast("Saved!", "info");
 * toast("Upload failed", "error");
 */
export function useToast(): ToastFunction {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── internals ────────────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ message, type, duration, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = TOAST_CONFIG[type as keyof typeof TOAST_CONFIG] ?? TOAST_CONFIG.info;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(handleDismiss, duration);
    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleDismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(onDismiss, 350); // wait for slide-out before unmounting
  }

  return (
    <div
      role="alert"
      className={`toast-item toast-${type} ${visible ? "toast-visible" : ""}`}
    >
      {cfg.icon}
      <span className="toast-message">{message}</span>
    </div>
  );
}
