import { useCallback, useEffect, useRef, useState } from 'react';
import {
   createFileSystemAdapter,
   isFileSystemSupported,
} from '../lib/fileSystem';
import type { FileEntry, FileSystemAdapter } from '../lib/fileSystem';

export type FileSystemState = {
   /** adapter aktif, atau null kalau browser tidak support */
   adapter: FileSystemAdapter | null;
   /** apakah browser support File System Access API */
   supported: boolean;
   /** nama folder aktif, null kalau belum pilih */
   folderName: string | null;
   /** daftar file & folder dari root, kosong kalau belum pilih folder */
   entries: FileEntry[];
   /** true saat operasi async (pick/restore) berjalan */
   loading: boolean;
};

export function useFileSystem() {
   const supported = isFileSystemSupported();

   /* adapter dibuat sekali, disimpan di ref agar tidak re-create */
   const adapterRef = useRef<FileSystemAdapter | null>(null);
   if (adapterRef.current === null && supported) {
      adapterRef.current = createFileSystemAdapter();
   }

   const [folderName, setFolderName] = useState<string | null>(null);
   const [entries, setEntries] = useState<FileEntry[]>([]);
   const [loading, setLoading] = useState(false);

   /* ---------- internal: refresh entries ---------- */
   const refreshEntries = useCallback(async () => {
      const adapter = adapterRef.current;
      if (!adapter || !adapter.hasAccess()) {
         setEntries([]);
         return;
      }
      const list = await adapter.listAll();
      setEntries(list);
   }, []);

   /* ---------- auto-restore folder terakhir saat mount ---------- */
   useEffect(() => {
      if (!supported) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      let cancelled = false;
      setLoading(true);

      (async () => {
         try {
            const ok = await adapter.restoreLast();
            if (cancelled) return;
            if (ok) {
               setFolderName(adapter.getFolderName());
               await refreshEntries();
            }
         } catch {
            /* ignore — tidak ada folder tersimpan */
         } finally {
            if (!cancelled) setLoading(false);
         }
      })();

      return () => {
         cancelled = true;
      };
   }, [supported, refreshEntries]);

   /* ---------- pick folder ---------- */
   const pickFolder = useCallback(async (): Promise<boolean> => {
      const adapter = adapterRef.current;
      if (!adapter) return false;

      setLoading(true);
      try {
         const ok = await adapter.pickDirectory();
         if (!ok) return false;
         setFolderName(adapter.getFolderName());
         await refreshEntries();
         return true;
      } finally {
         setLoading(false);
      }
   }, [refreshEntries]);

   /* ---------- release folder ---------- */
   const releaseFolder = useCallback(async () => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      await adapter.release();
      setFolderName(null);
      setEntries([]);
   }, []);

   /* ---------- operasi file ---------- */
   const readFile = useCallback(async (path: string): Promise<string> => {
      const adapter = adapterRef.current;
      if (!adapter) throw new Error('Tidak ada folder aktif.');
      return adapter.readFile(path);
   }, []);

   const writeFile = useCallback(
      async (path: string, content: string): Promise<void> => {
         const adapter = adapterRef.current;
         if (!adapter) throw new Error('Tidak ada folder aktif.');
         await adapter.writeFile(path, content);
      },
      []
   );

   const deleteFile = useCallback(async (path: string): Promise<void> => {
      const adapter = adapterRef.current;
      if (!adapter) throw new Error('Tidak ada folder aktif.');
      await adapter.deleteFile(path);
      await refreshEntries();
   }, [refreshEntries]);

   const createFolder = useCallback(
      async (path: string): Promise<void> => {
         const adapter = adapterRef.current;
         if (!adapter) throw new Error('Tidak ada folder aktif.');
         await adapter.createFolder(path);
         await refreshEntries();
      },
      [refreshEntries]
   );

   return {
      supported,
      folderName,
      entries,
      loading,
      pickFolder,
      releaseFolder,
      refreshEntries,
      readFile,
      writeFile,
      deleteFile,
      createFolder,
   };
}