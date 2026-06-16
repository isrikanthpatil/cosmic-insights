import React from 'react';
import AuthScreen from '@/components/AuthScreen';

// Presented as a modal route (see app/_layout.tsx). AuthScreen dismisses
// itself via router.back() once the user becomes authenticated.
export default function Login() {
  return <AuthScreen />;
}
