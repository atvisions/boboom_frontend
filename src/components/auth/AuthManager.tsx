'use client';

import { useAuth } from '@/hooks/useAuth';

/**
 * This component handles the authentication logic globally.
 * It doesn't render anything to the DOM.
 */
export function AuthManager() {
  useAuth();
  return null;
}

