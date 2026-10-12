import type { FileEntry, FileSystemAdapter } from './types';
import { IDB_NAME, IDB_STORE, IDB_KEY } from './types';

/* ===================== Tipe internal File System Access API ===================== */

type FSDirectoryHandle = FileSystemDirectoryHandle & {
   values(): AsyncIterableIterator<FSDirectoryHandle | FSFileHandle>;
   queryPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
   requestPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
};

type FSFileHandle = FileSystemFileHandle & {
   createWritable(): Promise<FileSystemWritableFileStream>;
   queryPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
   requestPermission?(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
};

/* ===================== IndexedDB helpers ===================== */

function openDB(): Promise<IDBDatabase> {
   return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
         const db = req.result;
         if (!db.objectStoreNames.contains(IDB_STORE)) {
            db.createObjectStore(IDB_STORE);
         }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
   });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
   const db = await openDB();
   return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
   });
}

async function idbSet(key: string, value: unknown): Promise<void> {
   const db = await openDB();
   return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
   });
}

async function idbDelete(key: string): Promise<void> {
   const db = await openDB();
   return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
   });
}

/* ===================== Path helpers ===================== */

function splitPath(path: string): string[] {
   return path.split('/').filter(Boolean);
}

function isAbortError(err: unknown): boolean {
   return err instanceof DOMException && err.name === 'AbortError';
}

/* ===================== NativeAdapter ===================== */

export class NativeAdapter implements FileSystemAdapter {
   private root: FSDirectoryHandle | null = null;

   hasAccess(): boolean {
      return this.root !== null;
   }

   getFolderName(): string | null {
      return this.root?.name ?? null;
   }

   async pickDirectory(): Promise<boolean> {
      try {
         const handle = (await (
            window as unknown as {
               showDirectoryPicker: (opts?: {
                  mode?: 'read' | 'readwrite';
               }) => Promise<FSDirectoryHandle>;
            }
         ).showDirectoryPicker({ mode: 'readwrite' })) as FSDirectoryHandle;

         this.root = handle;
         await idbSet(IDB_KEY, handle);
         return true;
      } catch (err) {
         if (isAbortError(err)) return false;
         throw err;
      }
   }

   async restoreLast(): Promise<boolean> {
      try {
         const handle = await idbGet<FSDirectoryHandle>(IDB_KEY);
         if (!handle) return false;

         /* cek permission — kalau belum granted, minta */
         if (handle.queryPermission) {
            const perm = await handle.queryPermission({ mode: 'readwrite' });
            if (perm === 'granted') {
               this.root = handle;
               return true;
            }
            if (handle.requestPermission) {
               const req = await handle.requestPermission({
                  mode: 'readwrite',
               });
               if (req === 'granted') {
                  this.root = handle;
                  return true;
               }
            }
            return false;
         }

         /* browser lama tanpa queryPermission — anggap granted */
         this.root = handle;
         return true;
      } catch {
         return false;
      }
   }

   async release(): Promise<void> {
      this.root = null;
      await idbDelete(IDB_KEY);
   }

   /* ---------- internal: resolve path → handle ---------- */

   private requireRoot(): FSDirectoryHandle {
      if (!this.root) throw new Error('Tidak ada folder aktif.');
      return this.root;
   }

   private async getFileHandle(
      path: string,
      create: boolean
   ): Promise<FSFileHandle> {
      const parts = splitPath(path);
      if (parts.length === 0) throw new Error('Path kosong.');

      let dir: FSDirectoryHandle = this.requireRoot();
      for (let i = 0; i < parts.length - 1; i++) {
         dir = await dir.getDirectoryHandle(parts[i], { create });
      }
      const fileName = parts[parts.length - 1];
      return (await dir.getFileHandle(fileName, {
         create,
      })) as FSFileHandle;
   }

   private async getDirHandle(
      path: string,
      create: boolean
   ): Promise<FSDirectoryHandle> {
      const parts = splitPath(path);
      let dir: FSDirectoryHandle = this.requireRoot();
      for (const part of parts) {
         dir = await dir.getDirectoryHandle(part, { create });
      }
      return dir;
   }

   /* ---------- file ops ---------- */

   async readFile(path: string): Promise<string> {
      const handle = await this.getFileHandle(path, false);
      const file = await handle.getFile();
      return await file.text();
   }

   async writeFile(path: string, content: string): Promise<void> {
      const handle = await this.getFileHandle(path, true);
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
   }

   async deleteFile(path: string): Promise<void> {
      const parts = splitPath(path);
      if (parts.length === 0) return;

      let dir: FSDirectoryHandle = this.requireRoot();
      for (let i = 0; i < parts.length - 1; i++) {
         dir = await dir.getDirectoryHandle(parts[i], { create: false });
      }
      const fileName = parts[parts.length - 1];
      await dir.removeEntry(fileName);
   }

   async createFolder(path: string): Promise<void> {
      await this.getDirHandle(path, true);
   }

   async listAll(): Promise<FileEntry[]> {
      const out: FileEntry[] = [];

      const walk = async (
         dir: FSDirectoryHandle,
         prefix: string
      ): Promise<void> => {
         for await (const entry of dir.values()) {
            const path = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.kind === 'directory') {
               out.push({ path, name: entry.name, kind: 'folder' });
               await walk(entry as FSDirectoryHandle, path);
            } else {
               out.push({ path, name: entry.name, kind: 'file' });
            }
         }
      };

      await walk(this.requireRoot(), '');
      return out;
   }
}