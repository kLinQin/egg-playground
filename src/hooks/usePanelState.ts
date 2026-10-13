import { useEffect, useState } from 'react';

type Key = 'files' | 'git';

function storageKey(key: Key, isMobile: boolean): string {
   return `webden-${key}-open-${isMobile ? 'mobile' : 'desktop'}`;
}

function read(key: Key, isMobile: boolean, fallback: boolean): boolean {
   try {
      const raw = localStorage.getItem(storageKey(key, isMobile));
      if (raw === null) return fallback;
      return raw === '1';
   } catch {
      return fallback;
   }
}

function write(key: Key, isMobile: boolean, value: boolean) {
   try {
      localStorage.setItem(storageKey(key, isMobile), value ? '1' : '0');
   } catch {
      /* ignore */
   }
}

/**
 * State buka/tutup file manager & git panel.
 * - Default PC: dua-duanya terbuka.
 * - Default mobile: dua-duanya tertutup.
 * - Persist per-device (desktop vs mobile dipisah).
 */
export function usePanelState(isMobile: boolean) {
   const [filesOpen, setFilesOpen] = useState(() =>
      read('files', isMobile, !isMobile)
   );
   const [gitOpen, setGitOpen] = useState(() =>
      read('git', isMobile, !isMobile)
   );

   /* saat device type berubah, re-read state untuk device itu */
   useEffect(() => {
      setFilesOpen(read('files', isMobile, !isMobile));
      setGitOpen(read('git', isMobile, !isMobile));
   }, [isMobile]);

   useEffect(() => {
      write('files', isMobile, filesOpen);
   }, [filesOpen, isMobile]);

   useEffect(() => {
      write('git', isMobile, gitOpen);
   }, [gitOpen, isMobile]);

   return {
      filesOpen,
      setFilesOpen,
      gitOpen,
      setGitOpen,
   };
}