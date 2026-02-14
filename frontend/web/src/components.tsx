import { useMemo, useState } from "react";

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "password";
}) {
  const id = useMemo(() => `tf_${Math.random().toString(16).slice(2)}`, []);
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ opacity: 0.8 }}>{props.label}</span>
      <input
        id={id}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(0,0,0,0.15)",
          fontSize: 14,
        }}
      />
    </label>
  );
}

export function Button(props: { label: string; onClick: () => void; variant?: "primary" | "secondary"; disabled?: boolean }) {
  const bg = props.variant === "secondary" ? "rgba(0,0,0,0.06)" : "#0ea5a5";
  const fg = props.variant === "secondary" ? "#111" : "#fff";
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.12)",
        background: bg,
        color: fg,
        cursor: props.disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
      }}
    >
      {props.label}
    </button>
  );
}

export function Card(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
      }}
    >
      {props.children}
    </div>
  );
}

export function Modal(props: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!props.open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
      }}
      onClick={props.onClose}
    >
      <div
        style={{
          width: "min(720px, calc(100vw - 32px))",
          maxHeight: "min(720px, calc(100vh - 32px))",
          overflow: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong>{props.title}</strong>
          <button onClick={props.onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{props.children}</div>
      </div>
    </div>
  );
}
