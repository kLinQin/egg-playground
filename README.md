# eggs

Code playground di browser dengan integrasi GitHub. Multi-tab, tema editor, dan bisa push/pull langsung dari UI.

## Fitur

- Editor dengan syntax highlighting (10+ bahasa via CodeMirror)
- Multi-tab — buka beberapa file sekaligus
- Theme editor (Dracula, Nord, VS Code Dark, GitHub Light, dll)
- Light & dark mode
- Font custom — upload `.ttf`/`.woff`/`.woff2`
- Preview Markdown dengan copy button di code block
- Integrasi GitHub — login Device Flow, Pull, Push, commit history
- Persistensi lokal (file, tab, settings)
- Responsive — drawer di mobile
- Keyboard shortcuts (Ctrl+S save, Ctrl+W close tab, Ctrl+F find, Ctrl+H replace)

## Stack

- React 19 + TypeScript
- Vite (build tool)
- CodeMirror 6 (editor)
- Octokit (GitHub API)
- marked + DOMPurify (Markdown rendering)

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

Buat file `.env` di root:

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

Catatan: Device Flow butuh proxy. Di dev pakai proxy Vite (`vite.config.ts`). Untuk production, kamu perlu reverse proxy di server (mis. Nginx) yang mengarahkan `/github-login/*` ke `https://github.com/login/*`.

## Keyboard Shortcuts

| Shortcut | Fungsi |
|---|---|
| Ctrl+S / Cmd+S | Save file aktif |
| Ctrl+W / Cmd+W | Tutup tab aktif |
| Ctrl+F / Cmd+F | Find |
| Ctrl+H / Cmd+H | Find & replace |
| Enter di search | Next match |
| Shift+Enter di search | Previous match |

## Struktur Proyek

```
src/
  components/           Komponen React
    Toolbar.tsx         Toolbar atas (brand, Save, Preview, Settings)
    FileManager.tsx     Sidebar kiri (daftar file)
    TabBar.tsx          Tab file yang terbuka
    Editor.tsx          Editor + preview Markdown
    GitPanel.tsx        Panel kanan (Git config + commit history)
  hooks/                Custom React hooks
    useTabs.ts          Multi-tab state
    useFileStorage.ts   Persistensi file
    useGitAuth.ts       Persistensi token GitHub
    useTheme.ts         Light/dark mode
  lib/
    github.ts           Octokit wrapper (pull, push, commit history)
  types.ts              TypeScript types
  App.tsx               Root component
  App.css               Global styles
```

## Lisensi

MIT
