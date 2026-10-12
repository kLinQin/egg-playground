export type FileKind = 'file' | 'folder';

export type FileItem = {
   id: string;
   name: string;
   /** 'file' atau 'folder' */
   kind: FileKind;
   /** null = root, string = id folder induk */
   parentId: string | null;
   content: string;
   /** konten terakhir yang di-save — untuk deteksi perubahan & restore */
   savedContent: string;
   /**
    * Snapshot konten sebelum user mulai edit (pertama kali sejak save terakhir).
    * Dipakai untuk fitur Discard: kembalikan ke versi sebelum edit.
    * - undefined → belum ada edit sejak save terakhir
    * - string → ada edit, revert ke nilai ini kalau Discard
    */
   preEditContent?: string;
   /** true kalau belum pernah di-push ke GitHub */
   isNew: boolean;
   /** state UI: folder sedang di-expand? */
   expanded?: boolean;

   /* ---------- sinkronisasi GitHub ---------- */
   /**
    * Path terakhir yang dikenal GitHub (mis. "src/index.ts").
    * null = belum pernah di-push.
    * Dipakai untuk deteksi rename/move & hapus file lama di GitHub.
    */
   lastSyncedPath: string | null;
   /**
    * Tombstone: user hapus file ini, tapi belum di-push ke GitHub.
    * Kalau true & lastSyncedPath !== null → perlu dihapus di GitHub.
    * Kalau true & lastSyncedPath === null → cukup hapus dari lokal.
    */
   deleted?: boolean;

   /* ---------- override bahasa editor ---------- */
   /**
    * ID bahasa (LangDef.id) untuk override highlighting.
    * null = pakai deteksi otomatis dari ekstensi.
    */
   languageOverride?: string | null;
};

export type FileTreeNode = {
   file: FileItem;
   children: FileTreeNode[];
   /** level kedalaman — 0 = root */
   depth: number;
};

export type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed';

export type ChangeItem = {
   file: FileItem;
   status: FileStatus;
   staged: boolean;
   /**
    * Path lama yang perlu dihapus di GitHub (kalau file di-rename/move).
    * Hanya terisi kalau status === 'renamed'.
    */
   deletePath?: string;
};

export type TabsState = {
   /** array of file id yang terbuka */
   tabs: string[];
   /** id file aktif */
   activeTabId: string | null;
};

export type GitConfig = {
   token: string;
   owner: string;
   repo: string;
   branch: string;
};

export type GitStatus =
   | { state: 'idle' }
   | { state: 'busy'; message: string }
   | { state: 'success'; message: string }
   | { state: 'error'; message: string };

export type Theme = 'light' | 'dark';

export type FontChoice = {
   id: string;
   label: string;
   family: string;
   dataBase64?: string;
   mimeType?: string;
};

export type StoredFont = {
   id: string;
   label: string;
   family: string;
   dataBase64: string;
   mimeType: string;
};

export type EditorSettings = {
   fontSize: number;
   lineHeight: number;
   lineNumbers: boolean;
   lineWrap: boolean;
   autocomplete: boolean;
   /** jumlah spasi untuk satu tingkat indentasi */
   tabSize: number;
   /** pakai tab char (true) atau spasi (false) */
   indentWithTabs: boolean;
   /** tampilkan garis indent guide */
   indentGuides: boolean;
   /** tampilkan error/warning di bawah kode */
   linting: boolean;
   /** sorot baris tempat cursor berada */
   highlightActiveLine: boolean;
   /** auto-tutup pasangan bracket & quote */
   closeBrackets: boolean;
};

/* ===================== Sumber file ===================== */

/**
 * Sumber file aktif editor.
 *
 * - 'local'  → data di localStorage (mode sekarang)
 * - 'disk'   → folder asli via File System Access API
 * - 'github' → repository yang di-pull
 *
 * Ketiganya eksklusif — ganti mode replace seluruh isi editor.
 */
export type FileSource = 'local' | 'disk' | 'github';

/**
 * Metadata file yang di-load dari disk.
 * Dipakai untuk mapping FileItem (React state) ↔ path asli.
 */
export type DiskFileMeta = {
   /** path relatif dari root folder, mis. "src/App.tsx" */
   path: string;
};