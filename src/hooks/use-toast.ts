"use client";

import { useCallback, useState } from "react";

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

const TOAST_LIMIT = 5;

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(
    (props: Omit<ToastMessage, "id">) => {
      const id = `toast-${++toastCount}`;
      const newToast: ToastMessage = { id, duration: 5000, ...props };

      setToasts((prev) => [newToast, ...prev].slice(0, TOAST_LIMIT));

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, newToast.duration);
      }

      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
