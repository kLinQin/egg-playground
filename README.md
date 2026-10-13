# Eggs

Code playground di browser dengan integrasi **GitHub** dan **Backblaze B2**. Multi-tab, tiga mode sumber file (**Local**, **GitHub**, **B2**), bisa pull/push langsung dari UI. Bisa diakses dari mana saja tanpa install apa pun.

**Live:** https://egg-playground.vercel.app/

## Fitur

### Editor
- Syntax highlighting 20+ bahasa via CodeMirror 6
- Multi-tab — buka beberapa file sekaligus
- Light & dark mode (GitHub Light + VS Code Dark)
- Font custom — upload `.ttf` / `.woff` / `.woff2` / `.otf`
- Line numbers, line wrap, autocomplete, linting, indent guides, close brackets, indent with tabs
- **UI zoom** (50–200%) — scale seluruh tampilan, tersimpan per-device
- **Reset ke default** — kembalikan semua setting ke nilai awal
- Markdown preview dengan copy button di code block
- Bottom bar editor — info kursor, bahasa, jumlah baris/karakter, error/warning
- Action bar (tombol 🔧) — Undo, Redo, Select All, Copy, Cut, Paste, Insert karakter
- Keyboard shortcuts (lihat tabel di bawah)

### Diff View
- Klik file di panel Changes → tampil diff **side-by-side** (sebelum vs sesudah)
- Read-only, memakai `@codemirror/merge`
- Highlight baris hijau (tambah) / merah (hapus)
- Header: nama file + status (Modified/Added/Deleted/Renamed) + counter `+add` / `−del`
- **Mobile:** switch **Sebelum / Sesudah** untuk lihat satu versi penuh pada satu waktu
- Otomatis tertutup saat file keluar dari Changes (Save All, Discard, Push)

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

### Mode Backblaze B2
- Cloud storage **10 GB gratis** — tanpa kartu kredit untuk daftar
- Setup via **form manual** (5 field: keyID, applicationKey, bucket, endpoint, region) atau **passcode** dari `.env` (unlock otomatis)
- **Pull** — ambil semua file dari bucket
- **Stage/Unstage** file (per file atau semua)
- **Push** — kirim staged files ke bucket B2
- **Restore** perubahan (per file atau semua)
- **Test Connection** — verifikasi config sebelum pull/push
- **Manifest-based sync** — daftar file disimpan di `__manifest.json` di root bucket (karena B2 memblokir list objects dari browser via CORS)
- CORS support via B2 CLI (`b2 bucket update ... --cors-rules`)
- Auto-generate commit SHA dari hash manifest untuk feedback visual

### UI / Layout
- **Help view** — tutorial lengkap di main area (bukan modal), toggle dari tombol `?` di toolbar kiri
- Source switch di tengah toolbar — pindah **Local ↔ GitHub ↔ Backblaze B2** dengan brand icons asli
- Di layar sempit, label "Backblaze B2" otomatis menyusut jadi "B2" (container query)
- Panel kiri (File Manager), tengah (Editor / Help / Diff), kanan (Git / Local / B2 Panel)
- Resizable panel (drag divider)
- **Panel state per-device** — default PC: file manager + git panel dua-duanya terbuka; default mobile: kedua drawer tertutup. Status buka/tutup diingat per device (desktop vs mobile dipisah)
- Mobile responsive — drawer untuk File Manager & Git panel, auto-close saat pilih file / buka diff / buka help / ganti source
- Settings editor — font size, line height, tab size, bottom bar height, tab max width, indent with tabs, dll
- Custom bottom bar height (range 20–60 px)
- Custom tab max width (range 80–300 px)
- **Stepper control** dengan **hold-to-repeat** — tap tahan tombol `−` / `+` untuk ubah nilai cepat (0.4s delay, 60ms repeat)
- Error boundary — tangkap error runtime dan tampilkan pesan
- Toast notification untuk error font
- Favicon & OG image untuk preview sosial (Discord, Twitter, dll)

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

- **React 19** + **TypeScript**
- **Vite** — build tool
- **CodeMirror 6** — editor
- **@codemirror/merge** — diff view
- **Octokit** — GitHub API
- **AWS SDK for JavaScript v3** (`@aws-sdk/client-s3`) — Backblaze B2 via S3-compatible API
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

Isi variabel berikut di `.env`:

```
# GitHub OAuth (untuk Device Flow)
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id_here

# Backblaze B2 (opsional — untuk fitur passcode unlock)
VITE_B2_PASSCODE=passcode-pilihanmu
VITE_B2_KEY_ID=005...
VITE_B2_APP_KEY=K005...
VITE_B2_BUCKET=nama-bucket
VITE_B2_ENDPOINT=s3.us-xxx-xxx.backblazeb2.com
VITE_B2_REGION=us-xxx-xxx
```

**Cara dapat GitHub Client ID:**

- Buka https://github.com/settings/developers
- Pilih **OAuth Apps** → **New OAuth App**
- Isi **Homepage URL**: `http://localhost:5173`
- Isi **Redirect URI**: `http://localhost:5173`
- Centang **Enable Device Flow**
- Klik **Register** → copy **Client ID**

**Cara setup Backblaze B2 (opsional):**

- Daftar di https://www.backblaze.com/sign-up/cloud-storage (gratis, tanpa kartu kredit)
- Buat bucket: Private, Encryption Enable, Object Lock Disable
- Buat Application Key: Read and Write, scoped ke bucket
- Copy `keyID` dan `applicationKey`
- Setup CORS via B2 CLI — lihat bagian **Konfigurasi CORS B2** di bawah

⚠️ **Peringatan keamanan:** Vite meng-embed semua `VITE_*` ke bundle JavaScript. Siapa pun yang buka DevTools bisa baca passcode + key kamu. **Aman** kalau hanya untuk lokal (`localhost`). **Tidak aman** kalau deploy ke publik. Untuk produksi, pindahkan key handling ke backend (Vercel Edge Function / Cloudflare Worker).

### 4. Jalankan dev server

```bash
npm run dev
```

Buka http://localhost:5173

## Konfigurasi CORS B2

Browser akan memblokir akses ke B2 tanpa izin CORS. Setup sekali per bucket:

**1. Install B2 CLI** (PowerShell di Windows):

```powershell
Invoke-WebRequest -Uri "https://github.com/Backblaze/B2_Command_Line_Tool/releases/latest/download/b2-windows.exe" -OutFile "b2.exe"
```

**2. Authorize:**

```powershell
.\b2.exe account authorize
```

Masukkan `keyID` dan `applicationKey`.

**3. Buat file `cors-rules.json`:**

```json
[
  {
    "corsRuleName": "eggsEditor",
    "allowedOrigins": ["http://localhost:5173", "https://egg-playground.vercel.app"],
    "allowedHeaders": ["*"],
    "allowedOperations": [
      "b2_download_file_by_id",
      "b2_download_file_by_name",
      "b2_upload_file",
      "s3_get",
      "s3_put",
      "s3_head",
      "s3_post",
      "s3_delete"
    ],
    "exposeHeaders": ["x-bz-content-sha1"],
    "maxAgeSeconds": 3600
  }
]
```

**4. Apply ke bucket:**

```powershell
$corsRules = (Get-Content .\cors-rules.json -Raw) -replace '\s', '' -replace '"', '\"'
.\b2.exe bucket update NAMA-BUCKET --cors-rules $corsRules allPrivate
```

**5. Verifikasi:**

```powershell
.\b2.exe bucket get NAMA-BUCKET
```

Cari bagian `corsRules` di output.

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
    Toolbar.tsx             Toolbar atas (file toggle, help toggle, source switch, font, theme, git)
    FileManager.tsx         Sidebar kiri (tree file/folder + action menu)
    TabBar.tsx              Tab file + tombol Save/Preview/Settings (dengan zoom, reset, stepper)
    Editor.tsx              Editor CodeMirror + preview Markdown
    EditorStatusBar.tsx     Bottom bar editor (info + action bar mode)
    MarkdownPreview.tsx     Render Markdown (marked + DOMPurify)
    GitPanel.tsx            Panel kanan GitHub (login, repo, changes, history, push)
    LocalPanel.tsx          Panel kanan Local (save all, discard, changes)
    B2Panel.tsx             Panel kanan Backblaze B2 (config, passcode unlock, pull/push)
    ChangesList.tsx         Komponen shared — daftar perubahan (dipakai Git/B2/Local)
    DiffView.tsx            Diff view side-by-side (@codemirror/merge)
    HelpView.tsx            Panel tutorial di main area (bukan modal)
    HelpModal.tsx           (legacy) Modal tutorial — tidak dipakai
    ConfirmDialog.tsx       Dialog konfirmasi (termasuk 3-button variant)
    ErrorBoundary.tsx       Fallback UI saat error runtime
    NumberField.tsx         (legacy) Input angka — digantikan StepperControl
    StepperControl.tsx      Stepper angka dengan hold-to-repeat
    ZoomControl.tsx         Kontrol zoom UI (dengan hold-to-repeat)
  hooks/
    useTabs.ts              Multi-tab state
    useFileStorage.ts       Persistensi file di localStorage
    useGitAuth.ts           Persistensi token GitHub
    useB2Auth.ts            Persistensi config Backblaze B2
    useTheme.ts             Light/dark mode
    useEditorSettings.ts    Settings editor + resetAll
    useCustomFonts.ts       Font custom (upload, remove)
    useKeyboardShortcuts.ts Shortcut global
    useMediaQuery.ts        Deteksi viewport mobile
    useResizable.ts         Panel resizable
    useZoom.ts              UI zoom (persist per localStorage)
    usePanelState.ts        State buka/tutup panel per-device (desktop/mobile)
  lib/
    github.ts               Octokit wrapper (pull, push, commit history)
    cloudStorage.ts         Backblaze B2 wrapper (pull, push, verify, manifest)
    helpContent.tsx         Konten tutorial (12 section: welcome, local, github, b2, diff, settings, mobile, shortcuts, troubleshooting, faq, tips, about)
    fileIcons.tsx           Mapping ekstensi → icon (react-icons/si)
  assets/                   Asset statis (hero.png, react.svg, vite.svg)
  languages.ts              Definisi bahasa + loader lazy (CodeMirror)
  editorLint.ts             Konfigurasi linting CodeMirror
  types.ts                  TypeScript types (FileItem, GitConfig, B2Config, FileSource, dll)
  App.tsx                   Root component
  App.css                   Entry point CSS (import dari src/styles/*)
  styles/
    base.css                Reset, scrollbar, theme variables, focus reset
    layout.css              Layout app, resize handle, main, drawer
    toolbar.css             Toolbar, source switch, icon button, dropdown, stepper, zoom
    file-manager.css        File manager + file items + action menu
    tab-bar.css             Tab bar + tab items
    editor.css              Editor split + CodeMirror panels
    markdown.css            Markdown preview + code copy button
    git-panel.css           Git panel + changes + commit history + B2 panel shared styles
    local-panel.css         Local panel
    status-bar.css          Status bar + language dropdown + action bar
    dialogs.css             Dialog + toast + error boundary
    help-modal.css          Help modal + help view + hint boxes + tables
    diff-view.css           Diff view styles
    responsive.css          Semua @media (max-width: 768px)
  index.css                 Style tambahan (Vite default)
  main.tsx                  Entry point
  vite-env.d.ts             Vite type declaration

public/
  favicon.svg               Icon app
  og-image.svg              Sumber OG image
  og-image.png              OG image 1200×630 (untuk preview sosial)
```

## Deployment

### Vercel (recommended)

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Set environment variables di Vercel dashboard (Vite akan inject otomatis)
4. Deploy

**Untuk Device Flow di production:** butuh reverse proxy untuk route `/github-login/*` → `https://github.com/login/*`. Vercel bisa pakai `vercel.json` rewrites:

```json
{
  "rewrites": [
    {
      "source": "/github-login/:path*",
      "destination": "https://github.com/login/:path*"
    }
  ]
}
```

### Netlify / Cloudflare Pages

Mirip Vercel — setup rewrites untuk `/github-login/*`. Lihat dokumentasi platform masing-masing.

## Batasan

- **File binary** (gambar, video) tidak di-handle — hanya file teks
- **Ukuran file maksimum** saat pull: 500 KB per file
- **GitHub API**: rate limit 5000 request/jam untuk authenticated user
- **B2**: egress gratis 3× rata-rata storage bulanan; folder kosong tidak di-push
- **B2 manifest**: file `__manifest.json` jangan dihapus manual dari B2 console
- **Diff view** bersifat read-only
- **UI zoom** butuh browser modern (dukungan `zoom` CSS + `dvh`)

## Lisensi

MIT