import { NativeAdapter } from './native';
import type { FileSystemAdapter } from './types';

export type { FileEntry, FileSystemAdapter } from './types';

/**
 * Cek apakah browser mendukung File System Access API.
 *
 * - Chrome/Edge Desktop: ✅
 * - Chrome Android 132+: ✅
 * - Firefox / Safari / iOS: ❌
 */
export function isFileSystemSupported(): boolean {
   return (
      typeof window !== 'undefined' &&
      'showDirectoryPicker' in window &&
      typeof (
         window as unknown as { showDirectoryPicker?: unknown }
      ).showDirectoryPicker === 'function'
   );
}

/**
 * Buat adapter file system.
 *
 * Return null kalau browser tidak support — UI harus
 * sembunyikan tombol "Folder" dalam kasus ini.
 */
export function createFileSystemAdapter(): FileSystemAdapter | null {
   if (!isFileSystemSupported()) return null;
   return new NativeAdapter();
}