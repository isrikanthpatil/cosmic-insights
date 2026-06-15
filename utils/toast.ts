// Tiny module-level pub/sub for non-blocking toast messages. No React context
// required — call showToast(...) from anywhere, and ToastHost subscribes once
// at the app root to render them.

export type ToastType = 'success' | 'info';

export interface ToastPayload {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();
let counter = 0;

/** Show a non-blocking toast. `type` defaults to 'info'. */
export function showToast(message: string, type: ToastType = 'info'): void {
  counter += 1;
  const payload: ToastPayload = { id: counter, message, type };
  listeners.forEach((fn) => fn(payload));
}

/** Subscribe to toast events. Returns an unsubscribe function. */
export function subscribeToast(fn: ToastListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
