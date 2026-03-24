"use client";

import { AlertCircle, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();

      // Trap focus inside dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose, loading],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus the cancel button on open (safer default than confirm)
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-desc" : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 mx-4 w-full max-w-[400px] overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: "var(--b-bg, hsl(var(--card)))",
          borderColor: "var(--b-border, hsl(var(--border)))",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            aria-hidden="true"
            style={{
              backgroundColor: isDanger
                ? "rgba(239,68,68,0.1)"
                : "var(--b-accent-soft, rgba(20,184,166,0.1))",
            }}
          >
            <AlertCircle
              className="h-4.5 w-4.5"
              style={{
                color: isDanger
                  ? "rgb(239,68,68)"
                  : "var(--b-accent, rgb(20,184,166))",
              }}
            />
          </div>
          <div className="flex-1 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-[14px] font-semibold"
              style={{ color: "var(--b-text, hsl(var(--foreground)))" }}
            >
              {title}
            </h3>
            {description && (
              <p
                id="confirm-dialog-desc"
                className="mt-1 text-[12px] leading-relaxed"
                style={{
                  color: "var(--b-text-3, hsl(var(--muted-foreground)))",
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
            style={{ color: "var(--b-text-4, hsl(var(--muted-foreground)))" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-3.5 py-2 text-[12px] font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
            style={{ color: "var(--b-text-2, hsl(var(--foreground)))" }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{
              backgroundColor: isDanger ? "rgb(239,68,68)" : "var(--b-accent, rgb(20,184,166))",
            }}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
