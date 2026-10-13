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
   /** true kalau belum pernah di-push ke backend cloud */
   isNew: boolean;
   /** state UI: folder sedang di-expand? */
   expanded?: boolean;

   /* ---------- sinkronisasi cloud (GitHub / B2) ---------- */
   /**
    * Path terakhir yang dikenal backend cloud (mis. "src/index.ts").
    * null = belum pernah di-push.
    * Dipakai untuk deteksi rename/move & hapus file lama di cloud.
    */
   lastSyncedPath: string | null;
   /**
    * Tombstone: user hapus file ini, tapi belum di-push ke cloud.
    * Kalau true & lastSyncedPath !== null → perlu dihapus di cloud.
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
    * Path lama yang perlu dihapus di cloud (kalau file di-rename/move).
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

export type B2Config = {
   keyId: string;
   applicationKey: string;
   bucket: string;
   /** mis. "s3.us-east-005.backblazeb2.com" */
   endpoint: string;
   /** mis. "us-east-005" */
   region: string;
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
   /** tinggi bottom bar (editor, git, local, file manager) */
   bottomBarHeight: number;
   /** lebar maksimum setiap tab di tab bar */
   tabMaxWidth: number;
};

/* ===================== Sumber file ===================== */

/**
 * Sumber file aktif editor.
 *
 * - 'local'  → data di localStorage
 * - 'github' → repository yang di-pull via GitHub API
 * - 'b2'     → bucket Backblaze B2 via S3-compatible API
 *
 * Ketiganya eksklusif — ganti mode replace seluruh isi editor.
 */
export type FileSource = 'local' | 'github' | 'b2';