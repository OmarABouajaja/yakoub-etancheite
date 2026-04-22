import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to guard against accidental navigation when a form has unsaved changes.
 * 
 * Uses both:
 * - `beforeunload` for browser-level navigation (tab close, URL bar)
 * - React Router `useBlocker` for in-app navigation
 * 
 * @param isDirty - Whether the form currently has unsaved changes
 * @param message - Optional custom warning message
 */
export const useUnsavedChanges = (
  isDirty: boolean,
  message: string = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?'
) => {
  // Browser-level: tab close, refresh, URL bar navigation
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own generic message
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, message]);

  // React Router: in-app navigation (Link, navigate(), back button)
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        return isDirty && currentLocation.pathname !== nextLocation.pathname;
      },
      [isDirty]
    )
  );

  // Auto-confirm/reset when blocker triggers
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(message);
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  return { blocker };
};
