"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Toast notification component.
 * Shows a temporary message at the bottom of the screen.
 *
 * Usage:
 *   <Toast message="Vente enregistrée ✅" type="success" />
 *
 * Or use the useToast hook:
 *   const { showToast, ToastComponent } = useToast();
 *   showToast("Vente enregistrée ✅", "success");
 */
export function Toast({ message, type = "success", visible = true, onClose }) {
  useEffect(() => {
    if (visible && onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`toast toast-${type} ${visible ? "visible" : ""}`}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

/**
 * Hook for easy toast management.
 * @returns {{ showToast: (msg: string, type?: string) => void, ToastComponent: JSX.Element }}
 */
export function useToast() {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const ToastComponent = (
    <Toast message={toast.message} type={toast.type} visible={toast.visible} onClose={hideToast} />
  );

  return { showToast, ToastComponent };
}
