import { useEffect, useState } from 'react';
import type { FileItem } from '../types';

const FILES_KEY = 'webden-files';
const ACTIVE_KEY = 'webden-active-file-id';

function readFiles(): FileItem[] {
   try {
      const raw = localStorage.getItem(FILES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as FileItem[];
      return Array.isArray(parsed) ? parsed : [];
   } catch {
      return [];
   }
}

function readActiveId(): string | null {
   try {
      return localStorage.getItem(ACTIVE_KEY);
   } catch {
      return null;
   }
}

export function useFileStorage() {
   const [files, setFiles] = useState<FileItem[]>(readFiles);
   const [activeId, setActiveId] = useState<string | null>(readActiveId);

   /* persist files */
   useEffect(() => {
      try {
         localStorage.setItem(FILES_KEY, JSON.stringify(files));
      } catch {
         // quota exceeded, ignore
      }
   }, [files]);

   /* persist activeId */
   useEffect(() => {
      try {
         if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
         else localStorage.removeItem(ACTIVE_KEY);
      } catch {
         // ignore
      }
   }, [activeId]);

   /* kalau activeId tidak ada di files, reset */
   useEffect(() => {
      if (activeId && !files.some((f) => f.id === activeId)) {
         setActiveId(files[0]?.id ?? null);
      }
   }, [files, activeId]);

   const clearAll = () => {
      setFiles([]);
      setActiveId(null);
      localStorage.removeItem(FILES_KEY);
      localStorage.removeItem(ACTIVE_KEY);
   };

   return {
      files,
      setFiles,
      activeId,
      setActiveId,
      clearAll,
   };
}