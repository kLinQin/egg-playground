# eggs

Code playground di browser dengan integrasi GitHub. Multi-tab, dua mode sumber file (**Local** & **GitHub**), bisa pull/push langsung dari UI.

## Fitur

### Editor
- Syntax highlighting 20+ bahasa via CodeMirror 6
- Multi-tab — buka beberapa file sekaligus
- Light & dark mode (GitHub Light + VS Code Dark)
- Font custom — upload `.ttf`/`.woff`/`.woff2`
- Line numbers, line wrap, autocomplete, linting, indent guides, close brackets
- Markdown preview dengan copy button di code block
- Bottom bar editor — info kursor, bahasa, jumlah baris/karakter, error/warning
- Action bar (tombol 🔧) — Undo, Redo, Select All, Copy, Cut, Paste, Insert karakter
- Keyboard shortcuts (lihat tabel di bawah)

### Mode Local
- File & folder disimpan di `localStorage`
- Buat, rename, move (drag & drop), hapus file/folder
- Save per file (**Ctrl+S**) → file masuk ke Changes dengan tag "saved"
- **Save All** — simpan semua file di Changes sekaligus
- **Discard** — buang perubahan (per file atau semua)
- Clear All Local — hapus semua file lokal

### Mode GitHub
- Login via **Device Flow** (direkomendasikan) atau **Personal Access Token (PAT)**
- Pilih owner, repo, branch (dengan search)
- **Pull** — ambil semua file dari repo
- **Stage/Unstage** file (per file atau semua)
- **Push** — kirim staged files ke GitHub dengan commit message
- **Restore** perubahan (per file atau semua) dengan inline confirm ✓/✕
- **History** — lihat daftar commit terakhir (toggle dari bottom bar)

### UI / Layout
- Help modal — tutorial lengkap (icon `?` di toolbar kanan)
- Source switch di tengah toolbar — pindah Local ↔ GitHub
- Panel kiri (File Manager), tengah (Editor), kanan (Git/Local Panel)
- Resizable panel (drag divider)
- Mobile responsive — drawer untuk File Manager & Git panel
- Settings editor — font size, line height, tab size, bottom bar height, tab max width, dll
- Custom bottom bar height (range 20–40 px)
- Custom tab max width (range 80–300 px)
- Error boundary — tangkap error runtime dan tampilkan pesan

### Keyboard Shortcuts

| Shortcut | Fungsi |
|---|---|
| Ctrl+S / Cmd+S | Save file aktif |
| Ctrl+W / Cmd+W | Tutup tab aktif |
| Ctrl+F / Cmd+F | Find |
| Ctrl+H / Cmd+H | Find & replace |
| Enter di search | Next match |
| Shift+Enter di search | Previous match |
| Esc | Tutup dialog / batalkan aksi |

## Stack

- **React 19** + TypeScript 6
- **Vite 8** — build tool
- **CodeMirror 6** — editor
- **Octokit** — GitHub API
- **marked** + **DOMPurify** — Markdown rendering
- **lucide-react** — icon UI
- **react-icons** (Simple Icons) — icon bahasa & file
- **oxlint** — linter

## Setup Lokal

### 1. Clone repo

```bash
git clone https://github.com/kLinQin/egg-playground.git
cd egg-playground
```

### 2. Install dependency

```bash
npm install
```

### 3. Setup environment

Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi `VITE_GITHUB_CLIENT_ID`:

```
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id_here
```

Cara dapat Client ID:

- Buka https://github.com/settings/developers
- Pilih **OAuth Apps** → **New OAuth App**
- Isi **Homepage URL**: `http://localhost:5173`
- Isi **Redirect URI**: `http://localhost:5173`
- Centang **Enable Device Flow**
- Klik **Register** → copy **Client ID**

### 4. Jalankan dev server

```bash
npm run dev
```

Buka http://localhost:5173

## Build Production

```bash
npm run build
npm run preview
```

**Catatan:** Device Flow butuh proxy. Di dev pakai proxy Vite (`vite.config.ts` — route `/github-login/*` → `https://github.com/login/*`). Untuk production, kamu perlu reverse proxy di server (mis. Nginx) dengan rewrite yang sama.

## Struktur Proyek

```
src/
  components/
    Toolbar.tsx             Toolbar atas (brand, source switch, font, theme, git, help)
    FileManager.tsx         Sidebar kiri (tree file/folder + action menu)
    TabBar.tsx              Tab file + tombol Save/Preview/Settings
    Editor.tsx              Editor CodeMirror + preview Markdown
    EditorStatusBar.tsx     Bottom bar editor (info + action bar mode)
    MarkdownPreview.tsx     Render Markdown (marked + DOMPurify)
    GitPanel.tsx            Panel kanan GitHub (login, repo, changes, history, push)
    LocalPanel.tsx          Panel kanan Local (save all, discard, changes)
    HelpModal.tsx           Modal tutorial (sidebar + konten)
    ConfirmDialog.tsx       Dialog konfirmasi
    ErrorBoundary.tsx       Fallback UI saat error runtime
  hooks/
    useTabs.ts              Multi-tab state
    useFileStorage.ts       Persistensi file di localStorage
    useGitAuth.ts           Persistensi token GitHub
    useTheme.ts             Light/dark mode
    useEditorSettings.ts    Settings editor (font size, bottom bar height, dll)
    useCustomFonts.ts       Font custom (upload, remove)
    useKeyboardShortcuts.ts Shortcut global
    useMediaQuery.ts        Deteksi viewport mobile
    useResizable.ts         Panel resizable
  lib/
    github.ts               Octokit wrapper (pull, push, commit history)
    helpContent.tsx         Konten tutorial (5 section)
    fileIcons.tsx           Mapping ekstensi → icon (react-icons/si)
  assets/                   Asset statis (hero.png, react.svg, vite.svg)
  languages.ts              Definisi bahasa + loader lazy (CodeMirror)
  editorLint.ts             Konfigurasi linting CodeMirror
  types.ts                  TypeScript types
  App.tsx                   Root component
  App.css                   Global styles
  index.css                 Style tambahan (Vite default)
  main.tsx                  Entry point
  vite-env.d.ts             Vite type declaration
```

## Lisensi

MIT