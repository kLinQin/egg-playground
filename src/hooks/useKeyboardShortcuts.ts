import { useEffect } from 'react';

type Handlers = {
   onSave?: () => void;
   onClose?: () => void;
   onFind?: () => void;
};

export function useKeyboardShortcuts(handlers: Handlers) {
   useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
         const mod = e.ctrlKey || e.metaKey;
         if (!mod) return;

         const key = e.key.toLowerCase();

         /* Ctrl+S / Cmd+S → save */
         if (key === 's' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            handlers.onSave?.();
            return;
         }

         /* Ctrl+W / Cmd+W → tutup file */
         if (key === 'w' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            handlers.onClose?.();
            return;
         }

         /* Ctrl+F / Cmd+F → find (placeholder) */
         if (key === 'f' && !e.shiftKey && !e.altKey) {
            handlers.onFind?.();
            return;
         }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
   }, [handlers]);
}