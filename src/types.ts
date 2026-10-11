export type FileItem = {
   id: string;
   name: string;
   content: string;
   /** konten sudah di-save? */
   saved: boolean;
   /** read-only saat saved === true dan user belum klik Edit */
   readOnly: boolean;
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

export type EditorTheme =
   | 'auto'
   | 'githubLight'
   | 'xcodeLight'
   | 'solarizedLight'
   | 'materialLight'
   | 'eclipse'
   | 'sublime'
   | 'oneDark'
   | 'dracula'
   | 'nord'
   | 'monokai'
   | 'tokyoNight'
   | 'githubDark'
   | 'materialDark'
   | 'vscodeDark'
   | 'solarizedDark';

export type EditorSettings = {
   fontSize: number;
   lineHeight: number;
   lineNumbers: boolean;
   lineWrap: boolean;
   autocomplete: boolean;
   editorTheme: EditorTheme;
};