import { useCallback, useEffect, useState } from 'react';
import type { TabsState, FileItem } from '../types';

const STORAGE_KEY = 'webden-tabs';

function read(): TabsState {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { tabs: [], activeTabId: null };
      const parsed = JSON.parse(raw) as TabsState;
      if (!Array.isArray(parsed.tabs)) {
         return { tabs: [], activeTabId: null };
      }
      return {
         tabs: parsed.tabs,
         activeTabId:
            typeof parsed.activeTabId === 'string' ? parsed.activeTabId : null,
      };
   } catch {
      return { tabs: [], activeTabId: null };
   }
}

export function useTabs(files: FileItem[]) {
   const [state, setState] = useState<TabsState>(read);

   /* persist ke localStorage */
   useEffect(() => {
      try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
         // ignore
      }
   }, [state]);

   /* ---------- helper: cek apakah id adalah file ---------- */
   const isFile = useCallback(
      (id: string): boolean => {
         const f = files.find((x) => x.id === id);
         return f?.kind === 'file';
      },
      [files]
   );

   /* ---------- buka tab (hanya untuk file) ---------- */
   const openTab = useCallback(
      (id: string) => {
         /* folder tidak bisa dibuka di tab */
         if (!isFile(id)) return;

         setState((prev) => {
            if (prev.tabs.includes(id)) {
               return { ...prev, activeTabId: id };
            }
            return {
               tabs: [...prev.tabs, id],
               activeTabId: id,
            };
         });
      },
      [isFile]
   );

   /* ---------- tutup tab ---------- */
   const closeTab = useCallback((id: string) => {
      setState((prev) => {
         const idx = prev.tabs.indexOf(id);
         if (idx === -1) return prev;

         const nextTabs = prev.tabs.filter((t) => t !== id);

         /* tentukan tab aktif berikutnya */
         let nextActive = prev.activeTabId;
         if (prev.activeTabId === id) {
            if (nextTabs.length === 0) {
               nextActive = null;
            } else if (idx >= nextTabs.length) {
               /* tab terakhir yang ditutup → pilih yang sebelumnya */
               nextActive = nextTabs[nextTabs.length - 1];
            } else {
               /* pilih tab di posisi yang sama (yang sekarang menggeser) */
               nextActive = nextTabs[idx];
            }
         }

         return { tabs: nextTabs, activeTabId: nextActive };
      });
   }, []);

   /* ---------- set aktif ---------- */
   const setActiveTab = useCallback((id: string) => {
      setState((prev) => {
         if (!prev.tabs.includes(id)) return prev;
         return { ...prev, activeTabId: id };
      });
   }, []);

   /* ---------- tutup semua ---------- */
   const closeAllTabs = useCallback(() => {
      setState({ tabs: [], activeTabId: null });
   }, []);

   /* ---------- bersihkan tab yang ID-nya tidak valid lagi ---------- */
   const pruneTabs = useCallback((validIds: string[]) => {
      setState((prev) => {
         const validSet = new Set(validIds);
         const nextTabs = prev.tabs.filter((id) => validSet.has(id));

         /* tidak ada perubahan */
         if (nextTabs.length === prev.tabs.length) {
            return prev;
         }

         let nextActive = prev.activeTabId;
         if (nextActive && !validSet.has(nextActive)) {
            nextActive = nextTabs.length > 0 ? nextTabs[0] : null;
         }

         return { tabs: nextTabs, activeTabId: nextActive };
      });
   }, []);

   return {
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      openTab,
      closeTab,
      setActiveTab,
      closeAllTabs,
      pruneTabs,
   };
}