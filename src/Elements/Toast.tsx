import { createContext, useContext, useState, useEffect, useRef } from "react";

// ─── config ───────────────────────────────────────────────────────────────────

const TOAST_CONFIG = {
  info: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    border: "#3b82f6",
    iconColor: "#3b82f6",
    bg: "#eff6ff",
  },
  warning: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    border: "#f59e0b",
    iconColor: "#d97706",
    bg: "#fffbeb",
  },
  error: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    border: "#ef4444",
    iconColor: "#dc2626",
    bg: "#fef2f2",
  },
};

// ─── context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

/**
 * Wrap your app (or a subtree) once with this provider.
 * Every descendant can then call useToast() to fire toasts.
 */
export function ToastProvider({ children, duration = 3500 }) {
  const [toasts, setToasts] = useState([]);

  function toast(message, type = "info") {
    const id = Date.now() + Math.random(); // safe for rapid-fire calls
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }

  function dismiss(id) {
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
 * toast("Low disk space", "warning");
 * toast("Upload failed", "error");
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ─── internals ────────────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column-reverse", // newest toast at the bottom
        gap: "10px",
        alignItems: "center",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ message, type, duration, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(handleDismiss, duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  }, []);

  function handleDismiss() {
    clearTimeout(timerRef.current);
    setVisible(false);
    setTimeout(onDismiss, 350); // wait for slide-out before unmounting
  }

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "12px",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        width: "360px",
        maxWidth: "90vw",
        pointerEvents: "auto",
        transform: visible ? "translateY(0)" : "translateY(80px)",
        opacity: visible ? 1 : 0,
        transition: visible
          ? "transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease"
          : "transform 0.3s ease-in, opacity 0.25s ease-in",
      }}
    >
      <span style={{ color: cfg.iconColor, flexShrink: 0, lineHeight: 1 }}>
        {cfg.icon}
      </span>

      <span style={{ flex: 1, fontSize: "14px", lineHeight: 1.5, color: "#111827" }}>
        {message}
      </span>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 0, color: "#9ca3af", lineHeight: 1, flexShrink: 0,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── demo ─────────────────────────────────────────────────────────────────────

function SaveButton() {
  const toast = useToast();
  return (
    <button onClick={() => toast("Changes saved successfully.", "info")}>
      Save (from child)
    </button>
  );
}

function DeleteButton() {
  const toast = useToast();
  return (
    <button onClick={() => toast("Item permanently deleted.", "error")}>
      Delete (from child)
    </button>
  );
}

export default function App() {
  const toast = useToast();

  return (
    <div style={{ padding: "40px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
      <button onClick={() => toast("File uploaded successfully.", "info")}>Info</button>
      <button onClick={() => toast("Storage is almost full.", "warning")}>Warning</button>
      <button onClick={() => toast("Connection failed. Please retry.", "error")}>Error</button>
      <SaveButton />
      <DeleteButton />
    </div>
  );
}

// Wrap App in your entry point:
//
// import { ToastProvider } from "./Toast";
//
// <ToastProvider>
//   <App />
// </ToastProvider>
