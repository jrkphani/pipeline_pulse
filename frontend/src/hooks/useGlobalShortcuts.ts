import { useEffect } from 'react';

/**
 * Centralized keyboard shortcut handler.
 * Prevents conflicts by checking active element before firing.
 */
interface ShortcutMap {
  [key: string]: {
    handler: (e: KeyboardEvent) => void;
    meta?: boolean;
    ctrl?: boolean;
    /** If true, fires even when an input/select/textarea is focused */
    allowInInput?: boolean;
  };
}

export function useGlobalShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(tag);

      for (const [key, config] of Object.entries(shortcuts)) {
        if (e.key !== key) continue;
        if (config.meta && !e.metaKey && !e.ctrlKey) continue;
        if (isInput && !config.allowInInput) continue;

        e.preventDefault();
        config.handler(e);
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
