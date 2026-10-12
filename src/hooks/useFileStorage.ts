import { useState } from 'react';
import type { FileItem } from '../types';

const FILES_KEY = 'webden-files';

/* ---------- tipe longgar untuk data mentah dari localStorage ---------- */
type LegacyFile = {
   id: string;
   name: string;
   content?: string;
   saved?: boolean;
   readOnly?: boolean;
   savedContent?: string;
   isNew?: boolean;
   kind?: 'file' | 'folder';
   parentId?: string | null;
   expanded?: boolean;
   lastSyncedPath?: string | null;
   deleted?: boolean;
};

function migrateFile(raw: LegacyFile): FileItem {
   const kind = raw.kind === 'folder' ? 'folder' : 'file';
   const parentId = typeof raw.parentId === 'string' ? raw.parentId : null;

   const lastSyncedPath =
      typeof raw.lastSyncedPath === 'string' ? raw.lastSyncedPath : null;

   const deleted = typeof raw.deleted === 'boolean' ? raw.deleted : undefined;

   /* ---------- format terbaru (punya savedContent + isNew) ---------- */
   if (
      typeof raw.savedContent === 'string' &&
      typeof raw.isNew === 'boolean'
   ) {
      return {
         id: raw.id,
         name: raw.name,
         kind,
         parentId,
         content: raw.content ?? '',
         savedContent: raw.savedContent,
         isNew: raw.isNew,
         expanded: raw.expanded,
         lastSyncedPath,
         deleted,
      };
   }

   /* ---------- format lama (punya `saved` boolean) ---------- */
   return {
      id: raw.id,
      name: raw.name,
      kind,
      parentId,
      content: raw.content ?? '',
      savedContent: raw.saved ? (raw.content ?? '') : '',
      isNew: true,
      expanded: raw.expanded,
      lastSyncedPath,
      deleted,
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

   /**
    * Simpan daftar file saat ini ke localStorage.
    * Dipanggil manual dari App (bukan otomatis) — hanya saat user
    * klik Save, switch mode dengan "Simpan", atau saat keluar.
    */
   const flushToStorage = () => {
      try {
         localStorage.setItem(FILES_KEY, JSON.stringify(files));
      } catch {
         /* quota exceeded, ignore */
      }
   };

   const clearAll = () => {
      setFiles([]);
      localStorage.removeItem(FILES_KEY);
   };

   return {
      files,
      setFiles,
      flushToStorage,
      clearAll,
   };
}