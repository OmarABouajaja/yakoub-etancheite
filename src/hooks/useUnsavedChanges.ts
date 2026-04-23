import { useEffect } from 'react';

/**
 * Hook to guard against accidental navigation when a form has unsaved changes.
 * 
 * Uses the browser `beforeunload` event to warn users before closing/refreshing
 * the tab when there are unsaved changes.
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
};
