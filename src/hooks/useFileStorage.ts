import { useEffect, useState } from 'react';
import type { FileItem } from '../types';

const FILES_KEY = 'webden-files';

/* ---------- migrasi data lama ---------- */
type LegacyFile = {
   id: string;
   name: string;
   content: string;
   saved?: boolean;
   readOnly?: boolean;
   savedContent?: string;
   isNew?: boolean;
};

function migrateFile(raw: LegacyFile): FileItem {
   /* sudah format baru? */
   if (
      typeof raw.savedContent === 'string' &&
      typeof raw.isNew === 'boolean'
   ) {
      return {
         id: raw.id,
         name: raw.name,
         content: raw.content,
         savedContent: raw.savedContent,
         isNew: raw.isNew,
      };
   }

   /* migrasi dari format lama:
      - kalau `saved: true` → savedContent = content
      - kalau `saved: false` → savedContent = '' (anggap belum pernah di-save) */
   return {
      id: raw.id,
      name: raw.name,
      content: raw.content,
      savedContent: raw.saved ? raw.content : '',
      isNew: true,
   };
}

function readFiles(): FileItem[] {
   try {
      const raw = localStorage.getItem(FILES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((f) => migrateFile(f as LegacyFile));
   } catch {
      return [];
   }
}

export function useFileStorage() {
   const [files, setFiles] = useState<FileItem[]>(readFiles);

   /* persist files */
   useEffect(() => {
      try {
         localStorage.setItem(FILES_KEY, JSON.stringify(files));
      } catch {
         // quota exceeded, ignore
      }
   }, [files]);

   const clearAll = () => {
      setFiles([]);
      localStorage.removeItem(FILES_KEY);
   };

   return {
      files,
      setFiles,
      clearAll,
   };
}