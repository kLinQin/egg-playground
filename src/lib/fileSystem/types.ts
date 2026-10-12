/**
 * Interface abstraksi file system.
 *
 * Implementasi:
 * - NativeAdapter: pakai File System Access API (Chrome/Edge/Android Chrome)
 *
 * Tidak ada fallback untuk Firefox/Safari/iOS — fitur disk hanya
 * tersedia di browser yang support.
 */

export type FileEntry = {
   /** path relatif dari root folder, mis. "src/App.tsx" */
   path: string;
   /** nama file/folder saja, mis. "App.tsx" */
   name: string;
   kind: 'file' | 'folder';
};

export type FileSystemAdapter = {
   /**
    * Buka folder picker. Return true kalau user memilih folder,
    * false kalau user cancel.
    *
    * Setelah berhasil, adapter menyimpan handle folder aktif.
    */
   pickDirectory(): Promise<boolean>;

   /**
    * Coba restore folder terakhir dari IndexedDB.
    * Return true kalau berhasil & permission masih valid.
    * Return false kalau tidak ada folder tersimpan / permission ditolak.
    */
   restoreLast(): Promise<boolean>;

   /**
    * Baca isi file sebagai string UTF-8.
    */
   readFile(path: string): Promise<string>;

   /**
    * Tulis string ke file. Buat file baru kalau belum ada.
    */
   writeFile(path: string, content: string): Promise<void>;

   /**
    * Hapus file.
    */
   deleteFile(path: string): Promise<void>;

   /**
    * Daftar semua file & folder secara rekursif dari root.
    * (Untuk project kecil-menengah, aman sampai ~1000 file.)
    */
   listAll(): Promise<FileEntry[]>;

   /**
    * Buat folder baru (rekursif, termasuk parent-nya).
    */
   createFolder(path: string): Promise<void>;

   /**
    * Cek apakah adapter masih punya akses ke folder aktif.
    */
   hasAccess(): boolean;

   /**
    * Lepas folder aktif (tidak menghapus file).
    */
   release(): Promise<void>;

   /**
    * Nama folder aktif (untuk ditampilkan di UI), atau null kalau tidak ada.
    */
   getFolderName(): string | null;
};

/** Nama IndexedDB database & store untuk simpan handle. */
export const IDB_NAME = 'webden-fs';
export const IDB_STORE = 'handles';
export const IDB_KEY = 'root-dir';