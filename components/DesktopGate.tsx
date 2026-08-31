import React from 'react';

/**
 * Native no-op. On iOS/Android the app always renders full-screen, so the gate
 * simply passes its children through. The desktop-web presentation lives in
 * DesktopGate.web.tsx and is only bundled for the web build.
 */
export default function DesktopGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
