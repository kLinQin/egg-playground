import type { ReactNode } from 'react';
import {
   Lightbulb,
   FolderPlus,
   MoreHorizontal,
   Trash2,
   Settings,
   Moon,
   Sun,
   Wrench,
   KeyRound,
   Cloud,
   ShieldCheck,
   HardDrive,
   AlertTriangle,
   Info,
   CheckCircle2,
   HelpCircle,
   Zap,
   Sparkles,
   Bug,
   BookOpen,
} from 'lucide-react';

export type HelpSection = {
   id: string;
   title: string;
   content: ReactNode;
};

/* Icon inline kecil untuk dipakai di dalam teks */
function InlineIcon({ children }: { children: ReactNode }) {
   return <span className="help__inline-icon">{children}</span>;
}

/* Hint box reusable */
function Hint({
   variant = 'info',
   children,
}: {
   variant?: 'info' | 'warning' | 'success';
   children: ReactNode;
}) {
   const Icon =
      variant === 'warning'
         ? AlertTriangle
         : variant === 'success'
            ? CheckCircle2
            : Info;

   return (
      <p className={`help__hint help__hint--${variant}`}>
         <Icon size={14} />
         <span>{children}</span>
      </p>
   );
}

export const HELP_SECTIONS: HelpSection[] = [
   /* ===================== 1. Selamat Datang ===================== */
   {
      id: 'welcome',
      title: 'Selamat Datang',
      content: (
         <>
            <h2>Apa itu Eggs?</h2>
            <p>
               <strong>Eggs</strong> adalah editor kode mini yang berjalan
               sepenuhnya di browser. Cocok untuk menulis, mengedit, dan
               menyimpan file kode tanpa perlu install apa pun.
            </p>

            <h3>Tiga mode utama</h3>
            <ul>
               <li>
                  <strong>Local</strong> — file disimpan di{' '}
                  <code>localStorage</code> browser. Cepat, offline, tidak perlu
                  login.
               </li>
               <li>
                  <strong>GitHub</strong> — file diambil dari repository GitHub.
                  Bisa edit, commit, dan push langsung dari browser.
               </li>
               <li>
                  <strong>Backblaze B2</strong> — file disimpan di bucket cloud
                  storage Backblaze B2. Cocok untuk backup ringan atau akses
                  dari mana saja tanpa repo Git.
               </li>
            </ul>

            <h3>Ganti mode</h3>
            <p>
               Klik tombol <strong>Local</strong>, <strong>GitHub</strong>, atau{' '}
               <strong>Backblaze B2</strong> di tengah toolbar atas. Semua file
               dari mode saat ini akan disimpan sementara, dan file dari mode
               tujuan akan dimuat.
            </p>

            <Hint variant="info">
               Kalau ada perubahan belum disimpan saat ganti mode, akan muncul
               dialog konfirmasi.
            </Hint>

            <h3>Fitur utama</h3>
            <ul>
               <li>
                  <strong>Editor CodeMirror 6</strong> — syntax highlighting
                  untuk 20+ bahasa, autocomplete, search & replace.
               </li>
               <li>
                  <strong>File manager</strong> — buat, rename, move (drag &
                  drop), hapus file & folder.
               </li>
               <li>
                  <strong>Multi-tab</strong> — buka banyak file sekaligus.
               </li>
               <li>
                  <strong>Markdown preview</strong> — preview real-time untuk
                  file <code>.md</code>.
               </li>
               <li>
                  <strong>Custom font</strong> — upload font sendiri (.woff2,
                  .woff, .ttf, .otf).
               </li>
               <li>
                  <strong>Dark mode</strong> — toggle light/dark sesuai
                  preferensi.
               </li>
            </ul>
         </>
      ),
   },

   /* ===================== 2. Mode Local ===================== */
   {
      id: 'local',
      title: 'Mode Local',
      content: (
         <>
            <h2>Mengelola file di Local</h2>
            <p>
               Mode <strong>Local</strong> menyimpan semua file di{' '}
               <code>localStorage</code> browser Anda. Tidak perlu login atau
               koneksi internet.
            </p>

            <h3>Buat file / folder baru</h3>
            <ul>
               <li>
                  Klik ikon <strong>+</strong> di header File Manager untuk buat
                  file baru.
               </li>
               <li>
                  Klik ikon{' '}
                  <InlineIcon>
                     <FolderPlus size={14} />
                  </InlineIcon>{' '}
                  untuk buat folder baru.
               </li>
               <li>Ketik nama, tekan Enter untuk konfirmasi, Esc untuk batal.</li>
            </ul>

            <h3>Edit file</h3>
            <ul>
               <li>Klik nama file di File Manager untuk membukanya.</li>
               <li>
                  Setelah selesai edit, tekan <kbd>Ctrl</kbd> + <kbd>S</kbd>{' '}
                  untuk simpan.
               </li>
               <li>
                  File yang sudah disimpan tapi belum di-commit akan muncul di
                  panel Changes dengan tanda <strong>saved</strong>.
               </li>
            </ul>

            <h3>Save All vs Save per file</h3>
            <ul>
               <li>
                  <strong>Save (Ctrl+S)</strong> — simpan file yang sedang
                  dibuka. File masuk ke Changes dengan tag "saved".
               </li>
               <li>
                  <strong>Save All</strong> — simpan semua file di Changes
                  sekaligus. Setelah Save All, Changes bersih.
               </li>
               <li>
                  <strong>Discard</strong> — buang perubahan, kembalikan ke
                  versi terakhir yang disimpan.
               </li>
            </ul>

            <h3>Rename, Move, Hapus</h3>
            <ul>
               <li>
                  Klik tombol{' '}
                  <InlineIcon>
                     <MoreHorizontal size={14} />
                  </InlineIcon>{' '}
                  di sebelah kanan nama file (muncul saat hover atau file aktif)
                  → pilih <em>Rename</em>, <em>Move</em>, atau <em>Hapus</em>.
               </li>
               <li>
                  Bisa juga drag & drop file ke folder untuk memindahkan.
               </li>
            </ul>

            <h3>Hapus semua file Local</h3>
            <p>
               Klik ikon{' '}
               <InlineIcon>
                  <Trash2 size={14} />
               </InlineIcon>{' '}
               di header File Manager (hanya muncul di mode Local) untuk hapus
               semua file. Akan ada konfirmasi dulu.
            </p>

            <Hint variant="warning">
               <strong>Backup penting:</strong> file Local tersimpan di{' '}
               <code>localStorage</code> browser. Kalau kamu bersihkan cache
               browser atau ganti device, file <strong>hilang permanen</strong>.
               Untuk data penting, pakai GitHub atau B2.
            </Hint>
         </>
      ),
   },

   /* ===================== 3. Mode GitHub ===================== */
   {
      id: 'github',
      title: 'Mode GitHub',
      content: (
         <>
            <h2>Kerja dengan GitHub</h2>
            <p>
               Mode <strong>GitHub</strong> memungkinkan Anda pull repository,
               edit file, dan push kembali ke GitHub — semuanya dari browser.
            </p>

            <h3>1. Login ke GitHub</h3>
            <p>Ada 2 cara login:</p>

            <h4>a) Device Flow (direkomendasikan)</h4>
            <ol>
               <li>
                  Klik tombol <strong>Login dengan GitHub</strong> di panel Git.
               </li>
               <li>
                  Akan muncul kode (mis. <code>ABCD-1234</code>) dan URL
                  verifikasi <code>github.com/login/device</code>.
               </li>
               <li>
                  Buka URL di browser, masukkan kode, lalu otorisasi aplikasi.
               </li>
               <li>
                  Setelah otorisasi, token otomatis tersimpan dan Anda
                  langsung login.
               </li>
            </ol>

            <h4>b) Personal Access Token (PAT)</h4>
            <p>
               Cara manual: buat token di GitHub, lalu paste ke kolom Token di
               panel Git.
            </p>

            <h5>Langkah membuat PAT:</h5>
            <ol>
               <li>
                  Buka{' '}
                  <a
                     href="https://github.com/settings/tokens"
                     target="_blank"
                     rel="noreferrer"
                  >
                     github.com/settings/tokens
                  </a>{' '}
                  (login dulu).
               </li>
               <li>
                  Klik <strong>Generate new token</strong> → pilih{' '}
                  <strong>Generate new token (classic)</strong>.
               </li>
               <li>
                  Isi <strong>Note</strong> dengan nama deskriptif (mis.{' '}
                  <code>eggs-editor</code>).
               </li>
               <li>
                  Atur <strong>Expiration</strong> — pilih durasi (mis. 90
                  hari).
               </li>
               <li>
                  Centang scope berikut:
                  <ul>
                     <li>
                        <code>repo</code> — akses penuh ke repository
                        (read/write, termasuk private).
                     </li>
                     <li>
                        <code>read:org</code> — baca info organisasi (opsional).
                     </li>
                     <li>
                        <code>workflow</code> — kelola GitHub Actions
                        (opsional).
                     </li>
                  </ul>
               </li>
               <li>
                  Klik <strong>Generate token</strong> di bawah.
               </li>
               <li>
                  <strong>Copy token</strong> segera (hanya tampil sekali).
                  Format: <code>ghp_xxxxxxxxxxxx</code>.
               </li>
               <li>
                  Kembali ke Eggs, paste token di kolom <strong>Token</strong>{' '}
                  di panel Git.
               </li>
               <li>
                  Klik <strong>Test Connection</strong> untuk verifikasi.
               </li>
            </ol>

            <Hint variant="info">
               <strong>Rekomendasi:</strong> gunakan{' '}
               <strong>Device Flow</strong> karena lebih aman (token tidak
               perlu copy-paste manual) dan tidak perlu atur scope sendiri.
               Gunakan PAT jika Device Flow tidak memungkinkan (mis. jaringan
               memblokir).
            </Hint>

            <Hint variant="warning">
               <strong>Keamanan token:</strong> token disimpan di{' '}
               <code>localStorage</code> browser Anda. Jangan login di
               komputer publik. Jika token bocor, segera revoke di{' '}
               <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
               >
                  github.com/settings/tokens
               </a>{' '}
               → <strong>Delete</strong>.
            </Hint>

            <h3>2. Pilih repo & branch</h3>
            <ul>
               <li>Setelah login, pilih <strong>Owner</strong> dari dropdown.</li>
               <li>Pilih <strong>Repo</strong> (bisa dicari).</li>
               <li>Pilih <strong>Branch</strong> — default biasanya <code>main</code>.</li>
            </ul>

            <h3>3. Pull file dari repo</h3>
            <p>
               Klik tombol <strong>Pull</strong> untuk mengambil semua file dari
               branch terpilih. Semua file lokal akan diganti dengan file dari
               repository.
            </p>
            <Hint variant="warning">
               Pull akan <strong>mengganti semua file lokal</strong>. Kalau ada
               perubahan belum di-push, akan hilang.
            </Hint>

            <h3>4. Edit & Push perubahan</h3>
            <ul>
               <li>Edit file langsung di editor.</li>
               <li>Tekan <kbd>Ctrl</kbd> + <kbd>S</kbd> untuk tanda "saved".</li>
               <li>
                  Di panel Changes, klik tombol <strong>+</strong> untuk stage
                  file yang mau di-push.
               </li>
               <li>
                  Isi <strong>Commit message</strong> di atas panel.
               </li>
               <li>
                  Klik <strong>Push</strong> untuk kirim perubahan ke GitHub.
               </li>
            </ul>

            <h3>5. Riwayat commit</h3>
            <p>
               Klik tombol <strong>History</strong> di bottom bar Git panel untuk
               lihat daftar commit terakhir. Bisa refresh manual.
            </p>

            <h3>6. Logout</h3>
            <p>
               Klik tombol <strong>Logout</strong> di samping nama user, atau
               hapus token via tombol ✕ di sebelah token display.
            </p>
         </>
      ),
   },

   /* ===================== 4. Mode Backblaze B2 ===================== */
   {
      id: 'b2',
      title: 'Mode Backblaze B2',
      content: (
         <>
            <h2>Kerja dengan Backblaze B2</h2>
            <p>
               Mode <strong>Backblaze B2</strong> menyimpan file Anda di bucket
               cloud storage Backblaze B2. Cocok untuk backup ringan, akses
               dari mana saja, dan tidak memerlukan repository Git.
            </p>
            <p>
               Backblaze B2 menyediakan <strong>10 GB gratis</strong> dan{' '}
               <strong>tidak butuh kartu kredit</strong> untuk mendaftar.
            </p>

            <h3>1. Buat akun Backblaze</h3>
            <ol>
               <li>
                  Buka{' '}
                  <a
                     href="https://www.backblaze.com/sign-up/cloud-storage"
                     target="_blank"
                     rel="noreferrer"
                  >
                     backblaze.com/sign-up/cloud-storage
                  </a>{' '}
                  — daftar gratis, tidak perlu kartu kredit.
               </li>
               <li>
                  Verifikasi email, lalu login ke dashboard Backblaze.
               </li>
               <li>
                  Di sidebar kiri, klik <strong>B2 Cloud Storage</strong> →{' '}
                  <strong>Buckets</strong>.
               </li>
            </ol>

            <h3>2. Buat bucket</h3>
            <ol>
               <li>
                  Klik tombol <strong>Create a Bucket</strong>.
               </li>
               <li>
                  Isi <strong>Bucket Unique Name</strong> — nama harus unik
                  secara global (mis. <code>kode-anda-2026</code>).
               </li>
               <li>
                  <strong>Files in Bucket are:</strong> pilih{' '}
                  <strong>Private</strong>.
               </li>
               <li>
                  <strong>Default Encryption:</strong> biarkan{' '}
                  <strong>Enable</strong> (default).
               </li>
               <li>
                  <strong>Object Lock:</strong> pilih <strong>Disable</strong>.
               </li>
               <li>
                  Klik <strong>Create a Bucket</strong>.
               </li>
            </ol>
            <Hint variant="info">
               Setelah bucket jadi, catat <strong>Endpoint</strong> dan{' '}
               <strong>Region</strong> dari halaman Bucket Settings. Format
               endpoint: <code>s3.us-xxx-xxx.backblazeb2.com</code>.
            </Hint>

            <h3>3. Buat Application Key</h3>
            <ol>
               <li>
                  Di sidebar kiri Backblaze, klik{' '}
                  <strong>Application Keys</strong>.
               </li>
               <li>
                  Klik <strong>Add a New Application Key</strong>.
               </li>
               <li>
                  <strong>Name of Key:</strong> isi nama deskriptif (mis.{' '}
                  <code>eggs-editor</code>).
               </li>
               <li>
                  <strong>Allow access to Bucket(s):</strong> pilih{' '}
                  <strong>bucket yang baru dibuat</strong> (jangan "All").
               </li>
               <li>
                  <strong>Type of Access:</strong> pilih{' '}
                  <strong>Read and Write</strong>.
               </li>
               <li>
                  <strong>File name prefix:</strong> kosongkan.
               </li>
               <li>
                  <strong>Duration (seconds):</strong> kosongkan (tidak
                  expired).
               </li>
               <li>
                  Centang <strong>Allow List All Bucket Names</strong> (kalau
                  ada).
               </li>
               <li>
                  Klik <strong>Create New Key</strong>.
               </li>
            </ol>
            <Hint variant="warning">
               Popup akan muncul <strong>sekali saja</strong>. Copy kedua
               nilai ini ke Notepad sekarang:
               <br />• <code>keyID</code> — mulai dengan <code>005...</code>
               <br />• <code>applicationKey</code> — mulai dengan{' '}
               <code>K005...</code>
               <br />
               Kalau popup ditutup tanpa copy, kamu harus buat key baru lagi.
            </Hint>

            <h3>4. Konfigurasi CORS (wajib untuk browser)</h3>
            <p>
               Browser akan memblokir akses ke B2 tanpa izin CORS. Kamu perlu
               install <strong>B2 CLI</strong> dulu:
            </p>
            <ol>
               <li>
                  Buka <strong>PowerShell</strong> (Windows).
               </li>
               <li>
                  Jalankan:
                  <pre>
                     {`Invoke-WebRequest -Uri "https://github.com/Backblaze/B2_Command_Line_Tool/releases/latest/download/b2-windows.exe" -OutFile "b2.exe"`}
                  </pre>
               </li>
               <li>
                  Authorize:
                  <pre>{`.\b2.exe account authorize`}</pre>
                  Masukkan <code>keyID</code> dan <code>applicationKey</code>.
               </li>
               <li>
                  Buat file <code>cors-rules.json</code>:
                  <pre>
                     {`[
  {
    "corsRuleName": "eggsEditor",
    "allowedOrigins": ["http://localhost:5173", "http://localhost:3000"],
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
]`}
                  </pre>
               </li>
               <li>
                  Apply ke bucket:
                  <pre>
                     {`.\b2.exe bucket update NAMA-BUCKET --cors-rules "$(Get-Content .\\cors-rules.json -Raw)" allPrivate`}
                  </pre>
               </li>
            </ol>
            <Hint variant="info">
               Kalau nanti deploy ke domain publik, tambahkan origin itu ke{' '}
               <code>allowedOrigins</code>.
            </Hint>

            <h3>5. Setup di Eggs</h3>
            <p>Ada dua cara:</p>

            <h4>a) Isi manual di panel B2</h4>
            <ol>
               <li>
                  Klik tombol <strong>Backblaze B2</strong> di toolbar atas
                  (tengah).
               </li>
               <li>
                  Isi 5 field di panel:
                  <ul>
                     <li>
                        <strong>Key ID</strong> — <code>005...</code>
                     </li>
                     <li>
                        <strong>Application Key</strong> — <code>K005...</code>
                     </li>
                     <li>
                        <strong>Bucket name</strong> — nama bucket kamu
                     </li>
                     <li>
                        <strong>Endpoint</strong> —{' '}
                        <code>s3.us-xxx-xxx.backblazeb2.com</code>
                     </li>
                     <li>
                        <strong>Region</strong> — mis.{' '}
                        <code>us-east-005</code>
                     </li>
                  </ul>
               </li>
               <li>
                  Klik <strong>Test Connection</strong>. Kalau berhasil akan
                  muncul: "Terhubung ke NAMA-BUCKET (0 file)".
               </li>
               <li>
                  Klik <strong>Selesai — Tampilkan Panel</strong>.
               </li>
            </ol>

            <h4>b) Pakai passcode (unlock otomatis)</h4>
            <p>
               Kalau Anda punya akses ke <code>.env</code> project, config B2
               bisa diisi otomatis lewat passcode. Cocok untuk setup berulang
               tanpa isi 5 field manual.
            </p>
            <ol>
               <li>
                  Isi <code>.env</code> di root project:
                  <pre>
                     {`VITE_B2_PASSCODE=passcode-pilihanmu
VITE_B2_KEY_ID=005...
VITE_B2_APP_KEY=K005...
VITE_B2_BUCKET=nama-bucket
VITE_B2_ENDPOINT=s3.us-xxx-xxx.backblazeb2.com
VITE_B2_REGION=us-xxx-xxx`}
                  </pre>
               </li>
               <li>
                  Restart dev server (<kbd>Ctrl</kbd> + <kbd>C</kbd> lalu{' '}
                  <code>npm run dev</code>).
               </li>
               <li>
                  Buka panel B2. Di bottom bar akan muncul ikon{' '}
                  <InlineIcon>
                     <KeyRound size={14} />
                  </InlineIcon>{' '}
                  di sebelah kanan.
               </li>
               <li>
                  Klik ikon kunci → seluruh panel di-replace dengan form
                  passcode.
               </li>
               <li>
                  Masukkan passcode → klik <strong>Unlock</strong>.
               </li>
               <li>
                  Config B2 terisi otomatis dari <code>.env</code> + auto Test
                  Connection.
               </li>
            </ol>
            <Hint variant="warning">
               <strong>Peringatan:</strong> Vite meng-embed semua{' '}
               <code>VITE_*</code> ke bundle JavaScript. Siapa pun yang buka
               DevTools bisa baca passcode + key kamu. <strong>Aman</strong>{' '}
               kalau hanya untuk lokal (<code>localhost</code>).{' '}
               <strong>Tidak aman</strong> kalau deploy ke publik.
            </Hint>

            <h3>6. Pull file dari bucket</h3>
            <p>
               Klik tombol <strong>Pull</strong> untuk mengambil semua file dari
               bucket. Semua file lokal akan diganti dengan file dari bucket.
            </p>

            <h3>7. Edit & Push perubahan</h3>
            <ul>
               <li>Edit file langsung di editor.</li>
               <li>
                  Tekan <kbd>Ctrl</kbd> + <kbd>S</kbd> untuk tanda "saved".
               </li>
               <li>
                  Di panel Changes, klik tombol <strong>+</strong> untuk stage
                  file yang mau di-push.
               </li>
               <li>
                  Isi <strong>Commit message</strong> di atas panel.
               </li>
               <li>
                  Klik <strong>Push</strong> untuk kirim perubahan ke bucket B2.
               </li>
            </ul>

            <h3>8. Struktur file & folder</h3>
            <p>
               B2 tidak punya folder asli — semua file disimpan sebagai{' '}
               <em>key</em> dengan <code>/</code> sebagai pemisah. Contoh:
            </p>
            <ul>
               <li>
                  File <code>src/App.tsx</code> → key{' '}
                  <code>src/App.tsx</code>
               </li>
               <li>
                  File <code>readme.md</code> di root → key{' '}
                  <code>readme.md</code>
               </li>
            </ul>
            <Hint variant="info">
               <strong>Folder kosong tidak akan ke-push.</strong> B2 tidak
               menyimpan folder tanpa isi. Kalau butuh folder kosong, taruh
               file placeholder di dalamnya (mis.{' '}
               <code>docs/.gitkeep</code>).
            </Hint>

            <h3>9. Manifest & cara kerja internal</h3>
            <p>
               Karena B2 memblokir operasi "list file" dari browser, Eggs
               menyimpan daftar file di file khusus bernama{' '}
               <code>__manifest.json</code> di root bucket.
            </p>
            <Hint variant="warning">
               <strong>Jangan hapus</strong> <code>__manifest.json</code>{' '}
               dari Backblaze console. Kalau terhapus, Pull akan menganggap
               bucket kosong. Recover: push ulang dari Eggs untuk regenerate
               manifest.
            </Hint>

            <h3>10. Logout / Ganti config</h3>
            <ul>
               <li>
                  Klik tombol <strong>Settings</strong> di header panel B2 →
                  akan muncul form config.
               </li>
               <li>
                  Klik tombol <strong>Logout</strong> (ikon di samping status
                  koneksi) untuk hapus semua config dari localStorage.
               </li>
               <li>
                  Atau klik ikon{' '}
                  <InlineIcon>
                     <KeyRound size={14} />
                  </InlineIcon>{' '}
                  di bottom bar untuk unlock dengan passcode baru.
               </li>
            </ul>

            <h3>Ringkasan alur</h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Tahap</th>
                     <th>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>
                        <Cloud size={14} /> Akun
                     </td>
                     <td>Daftar Backblaze → buat bucket → buat application key</td>
                  </tr>
                  <tr>
                     <td>
                        <ShieldCheck size={14} /> CORS
                     </td>
                     <td>Set CORS rules lewat B2 CLI</td>
                  </tr>
                  <tr>
                     <td>
                        <KeyRound size={14} /> Config
                     </td>
                     <td>Isi 5 field di panel B2 (manual atau via passcode)</td>
                  </tr>
                  <tr>
                     <td>
                        <HardDrive size={14} /> Pakai
                     </td>
                     <td>Pull → edit → stage → Push</td>
                  </tr>
               </tbody>
            </table>
         </>
      ),
   },
   /* ===================== 5. Pengaturan Editor ===================== */
   {
      id: 'settings',
      title: 'Pengaturan Editor',
      content: (
         <>
            <h2>Kustomisasi tampilan editor</h2>
            <p>
               Klik ikon{' '}
               <InlineIcon>
                  <Settings size={14} />
               </InlineIcon>{' '}
               (sliders) di kanan baris tab untuk buka panel pengaturan editor.
            </p>

            <h3>Ukuran & tampilan teks</h3>
            <ul>
               <li>
                  <strong>Font size</strong> — ukuran font editor (default 14).
               </li>
               <li>
                  <strong>Line height</strong> — jarak antar baris (default 1.5).
               </li>
               <li>
                  <strong>Line numbers</strong> — tampilkan nomor baris di kiri.
               </li>
               <li>
                  <strong>Line wrap</strong> — pindahkan otomatis baris panjang.
               </li>
            </ul>

            <h3>Perilaku editor</h3>
            <ul>
               <li>
                  <strong>Autocomplete</strong> — saran otomatis saat mengetik.
               </li>
               <li>
                  <strong>Indent guides</strong> — garis vertikal untuk indentasi.
               </li>
               <li>
                  <strong>Linting</strong> — tandai error/warning di kode.
               </li>
               <li>
                  <strong>Highlight active line</strong> — sorot baris tempat
                  cursor berada.
               </li>
               <li>
                  <strong>Close brackets</strong> — auto-tutup pasangan bracket
                  & quote.
               </li>
            </ul>

            <h3>Layout</h3>
            <ul>
               <li>
                  <strong>Bottom bar height</strong> — tinggi bottom bar di
                  semua panel (default 24, range 20–40).
               </li>
               <li>
                  <strong>Tab max width</strong> — lebar maksimum setiap tab
                  (default 80–300).
               </li>
            </ul>

            <h3>Bahasa & highlighting</h3>
            <p>
               Klik indikator bahasa di bottom bar editor (mis. <em>TS</em>,{' '}
               <em>PY</em>) untuk ganti bahasa manual. Pilih{' '}
               <strong>Auto</strong> untuk deteksi otomatis dari ekstensi file.
            </p>

            <h3>Tema</h3>
            <p>
               Klik ikon{' '}
               <InlineIcon>
                  <Moon size={14} />
               </InlineIcon>{' '}
               /{' '}
               <InlineIcon>
                  <Sun size={14} />
               </InlineIcon>{' '}
               di toolbar kanan untuk ganti antara light mode dan dark mode.
            </p>

            <h3>Font</h3>
            <p>
               Klik ikon <strong>Aa</strong> di toolbar kanan untuk pilih font
               atau upload font kustom (.woff2, .woff, .ttf, .otf).
            </p>
         </>
      ),
   },

   /* ===================== 6. Keyboard Shortcuts ===================== */
   {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      content: (
         <>
            <h2>Shortcut keyboard</h2>

            <h3>File & tab</h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Shortcut</th>
                     <th>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>S</kbd>
                     </td>
                     <td>Simpan file aktif</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>W</kbd>
                     </td>
                     <td>Tutup tab aktif</td>
                  </tr>
               </tbody>
            </table>

            <h3>Pencarian</h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Shortcut</th>
                     <th>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>F</kbd>
                     </td>
                     <td>Buka panel pencarian</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>H</kbd>
                     </td>
                     <td>Buka panel cari & ganti</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Enter</kbd>
                     </td>
                     <td>Cari berikutnya</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Shift</kbd> + <kbd>Enter</kbd>
                     </td>
                     <td>Cari sebelumnya</td>
                  </tr>
               </tbody>
            </table>

            <h3>Umum</h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Shortcut</th>
                     <th>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>
                        <kbd>Esc</kbd>
                     </td>
                     <td>Tutup dialog / batalkan aksi</td>
                  </tr>
               </tbody>
            </table>

            <h3>Mobile action bar</h3>
            <p>
               Klik tombol{' '}
               <InlineIcon>
                  <Wrench size={14} />
               </InlineIcon>{' '}
               di bottom bar editor untuk akses Undo, Redo, Select All, Copy,
               Cut, Paste, dan Insert karakter.
            </p>
         </>
      ),
   },

   /* ===================== 7. Troubleshooting ===================== */
   {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
         <>
            <h2>Masalah umum & solusinya</h2>
            <p>
               Kumpulan error yang sering muncul dan cara mengatasinya.
            </p>

            <h3>
               <Bug size={14} /> CORS error saat pull/push B2
            </h3>
            <p>
               <strong>Gejala:</strong> di console browser muncul pesan seperti
               "blocked by CORS policy" atau "NetworkError" saat klik Pull/Push
               di panel B2.
            </p>
            <p>
               <strong>Penyebab:</strong> CORS rules belum di-set di bucket B2.
            </p>
            <p>
               <strong>Solusi:</strong>
            </p>
            <ol>
               <li>
                  Pastikan <code>allowedOrigins</code> di CORS rules memuat{' '}
                  <code>http://localhost:5173</code> (atau port dev server
                  kamu).
               </li>
               <li>
                  Verifikasi CORS terpasang:{' '}
                  <code>.\b2.exe bucket get NAMA-BUCKET</code> — cari bagian{' '}
                  <code>corsRules</code>.
               </li>
               <li>
                  Tunggu 1 menit setelah update CORS — B2 butuh waktu
                  propagasi.
               </li>
               <li>
                  Hard refresh browser (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> +{' '}
                  <kbd>R</kbd>).
               </li>
            </ol>
            <Hint variant="info">
               Kalau tetap gagal, cek di <strong>DevTools → Network tab</strong>
               , cari request yang gagal, dan lihat response headers untuk pesan
               CORS detail.
            </Hint>

            <h3>
               <Bug size={14} /> Pull B2 kembali 0 file padahal bucket ada isi
            </h3>
            <p>
               <strong>Penyebab:</strong> file <code>__manifest.json</code>{' '}
               hilang atau terhapus dari bucket.
            </p>
            <p>
               <strong>Solusi:</strong> buka app, isi config B2 manual, push
               ulang file apa saja — manifest akan di-regenerate otomatis.
            </p>

            <h3>
               <Bug size={14} /> Passcode salah padahal sudah benar
            </h3>
            <p>
               <strong>Penyebab:</strong> kemungkinan ada spasi atau karakter
               tersembunyi di <code>.env</code>.
            </p>
            <p>
               <strong>Solusi:</strong>
            </p>
            <ol>
               <li>
                  Buka <code>.env</code>, pastikan{' '}
                  <code>VITE_B2_PASSCODE=xxx</code> tanpa spasi di sekitar{' '}
                  <code>=</code>.
               </li>
               <li>
                  Tidak ada kutip di sekitar nilai (kecuali kamu memang pakai
                  tanda kutip sebagai bagian passcode).
               </li>
               <li>
                  Restart dev server (<kbd>Ctrl</kbd> + <kbd>C</kbd> lalu{' '}
                  <code>npm run dev</code>) — Vite tidak auto-reload{' '}
                  <code>.env</code>.
               </li>
            </ol>

            <h3>
               <Bug size={14} /> File tidak muncul di bucket B2 setelah push
            </h3>
            <p>
               <strong>Cek berurutan:</strong>
            </p>
            <ol>
               <li>
                  Apakah file di-<strong>stage</strong> dulu? Tombol Push
                  hanya kirim file yang sudah di-stage (tanda + di panel
                  Changes).
               </li>
               <li>
                  Apakah commit message terisi? Kosong = tombol Push disabled.
               </li>
               <li>
                  Buka DevTools → Console, cek error.
               </li>
               <li>
                  Cek langsung di Backblaze console (refresh) — kadang cache UI
                  Backblaze lambat update.
               </li>
            </ol>

            <h3>
               <Bug size={14} /> Build error setelah update
            </h3>
            <p>
               Kalau <code>npm run build</code> gagal:
            </p>
            <ol>
               <li>
                  Hapus <code>node_modules</code> + <code>package-lock.json</code>,
                  lalu <code>npm install</code> ulang.
               </li>
               <li>
                  Clear Vite cache: <code>rm -rf node_modules/.vite</code>.
               </li>
               <li>
                  Cek versi Node.js — butuh Node 18+.
               </li>
            </ol>

            <h3>
               <Bug size={14} /> File lokal hilang setelah bersihkan browser
            </h3>
            <p>
               <strong>Penyebab:</strong> file Local disimpan di{' '}
               <code>localStorage</code>, yang terhapus kalau kamu clear
               browsing data.
            </p>
            <p>
               <strong>Solusi:</strong> file <strong>tidak bisa di-recover</strong>
               . Untuk ke depan, selalu backup ke GitHub atau B2.
            </p>
            <Hint variant="warning">
               <strong>Pencegahan:</strong> kalau kerja di mode Local, jangan
               klik "Clear browsing data" di browser, atau aktifkan opsi
               "Keep local data" untuk domain editor kamu.
            </Hint>
         </>
      ),
   },

   /* ===================== 8. FAQ ===================== */
   {
      id: 'faq',
      title: 'FAQ',
      content: (
         <>
            <h2>Pertanyaan yang sering ditanya</h2>

            <h3>
               <HelpCircle size={14} /> Apakah data saya aman?
            </h3>
            <p>
               <strong>Local:</strong> data ada di browser kamu, tidak dikirim
               ke mana-mana. Tapi bisa hilang kalau browser dibersihkan.
            </p>
            <p>
               <strong>GitHub:</strong> data dikirim ke repo GitHub kamu.
               Keamanan tergantung akun GitHub kamu (2FA, password kuat).
            </p>
            <p>
               <strong>B2:</strong> data dikirim ke bucket Backblaze kamu.
               Bucket Private + aplikasi key scoped = akses terbatas.
            </p>
            <Hint variant="warning">
               Token GitHub dan application key B2 disimpan di{' '}
               <code>localStorage</code> browser. Kalau kamu pakai komputer
               publik, <strong>logout sebelum pergi</strong>.
            </Hint>

            <h3>
               <HelpCircle size={14} /> Bisakah akses dari device lain?
            </h3>
            <ul>
               <li>
                  <strong>Local</strong> — tidak. Data terikat ke satu browser.
               </li>
               <li>
                  <strong>GitHub</strong> — ya, asal login dengan akun GitHub
                  yang sama di device lain.
               </li>
               <li>
                  <strong>B2</strong> — ya, asal config B2 di-set di device
                  lain (manual atau passcode).
               </li>
            </ul>

            <h3>
               <HelpCircle size={14} /> Berapa limit Backblaze B2 gratis?
            </h3>
            <ul>
               <li>
                  <strong>Storage:</strong> 10 GB gratis.
               </li>
               <li>
                  <strong>Egress:</strong> gratis 3× rata-rata storage bulanan.
               </li>
               <li>
                  <strong>API calls:</strong> gratis, tanpa batas harian.
               </li>
               <li>
                  <strong>Kartu kredit:</strong> tidak perlu untuk daftar.
               </li>
            </ul>
            <p>
               Untuk file kode (ukuran KB), 10 GB sangat cukup — bisa simpan
               ratusan ribu file.
            </p>

            <h3>
               <HelpCircle size={14} /> Bisakah pakai B2 untuk menyimpan file
               binary (gambar, video)?
            </h3>
            <p>
               <strong>Bisa</strong> di sisi B2, tapi editor Eggs{' '}
               <strong>tidak</strong> meng-handle binary dengan baik:
            </p>
            <ul>
               <li>
                  Pull hanya ambil file text (ekstensi di{' '}
                  <code>TEXT_EXTENSIONS</code>).
               </li>
               <li>
                  File binary akan di-skip saat Pull dengan hitungan di{' '}
                  <code>skipped</code>.
               </li>
               <li>
                  Editor CodeMirror tidak cocok untuk binary.
               </li>
            </ul>
            <Hint variant="info">
               Untuk file binary, upload langsung via Backblaze console atau B2
               CLI. Editor Eggs khusus untuk file kode/teks.
            </Hint>

            <h3>
               <HelpCircle size={14} /> Kenapa B2 butuh file{' '}
               <code>__manifest.json</code>?
            </h3>
            <p>
               B2 punya keterbatasan: <strong>list file dari browser diblokir
                  CORS</strong>. Untuk tahu file apa saja yang ada di bucket, Eggs
               simpan daftar di <code>__manifest.json</code> yang di-update
               setiap push.
            </p>
            <p>
               File ini <strong>jangan dihapus</strong> dari Backblaze console.
               Kalau terhapus, Pull akan return 0 file.
            </p>

            <h3>
               <HelpCircle size={14} /> Apakah bisa punya beberapa bucket B2?
            </h3>
            <p>
               Bisa di sisi B2, tapi <strong>satu instance Eggs</strong> hanya
               handle satu bucket per waktu. Kalau mau ganti bucket, klik{' '}
               <strong>Settings</strong> di panel B2 → isi field bucket baru.
            </p>

            <h3>
               <HelpCircle size={14} /> Kenapa deploy publik tidak aman untuk
               passcode .env?
            </h3>
            <p>
               Vite meng-<em>embed</em> semua variabel <code>VITE_*</code> ke
               bundle JavaScript yang dikirim ke browser. Artinya:
            </p>
            <ul>
               <li>
                  Siapa pun yang buka web kamu bisa lihat{' '}
                  <code>VITE_B2_PASSCODE</code> dan{' '}
                  <code>VITE_B2_APP_KEY</code> di DevTools.
               </li>
               <li>
                  Mereka bisa pakai key itu untuk akses bucket B2 kamu.
               </li>
            </ul>
            <p>
               <strong>Solusi untuk deploy publik:</strong> pindahkan
               key-handling ke backend (Vercel Edge Function / Cloudflare
               Worker) yang menyimpan secret di server, bukan bundle.
            </p>

            <h3>
               <HelpCircle size={14} /> Editor ini pakai teknologi apa?
            </h3>
            <ul>
               <li>
                  <strong>Frontend:</strong> React 18 + TypeScript + Vite
               </li>
               <li>
                  <strong>Editor:</strong> CodeMirror 6
               </li>
               <li>
                  <strong>GitHub integration:</strong> Octokit REST + OAuth
                  Device Flow
               </li>
               <li>
                  <strong>B2 integration:</strong> AWS SDK for JavaScript v3
                  (S3-compatible)
               </li>
               <li>
                  <strong>Icons:</strong> Lucide React
               </li>
            </ul>
         </>
      ),
   },

   /* ===================== 9. Tips & Trik ===================== */
   {
      id: 'tips',
      title: 'Tips & Trik',
      content: (
         <>
            <h2>Workflow efisien</h2>

            <h3>
               <Zap size={14} /> Drag & drop file antar folder
            </h3>
            <p>
               Di File Manager, kamu bisa <strong>drag file</strong> ke folder
               lain untuk memindahkan. Akan muncul outline putus-putus di folder
               target.
            </p>

            <h3>
               <Zap size={14} /> Multi-tab untuk kerja paralel
            </h3>
            <p>
               Buka banyak file sekaligus, klik tab untuk pindah. Tutup tab
               dengan <kbd>Ctrl</kbd> + <kbd>W</kbd> atau klik ✕ di tab.
            </p>

            <h3>
               <Zap size={14} /> Preview markdown real-time
            </h3>
            <p>
               Buka file <code>.md</code>, klik ikon preview di tab bar untuk
               split view editor + preview. Berguna untuk menulis dokumentasi.
            </p>

            <h3>
               <Zap size={14} /> Search & replace
            </h3>
            <p>
               <kbd>Ctrl</kbd> + <kbd>F</kbd> untuk search,{' '}
               <kbd>Ctrl</kbd> + <kbd>H</kbd> untuk search + replace. Bisa
               replace satu per satu atau semua sekaligus.
            </p>

            <h3>
               <Zap size={14} /> Upload font kustom
            </h3>
            <p>
               Klik ikon <strong>Aa</strong> di toolbar kanan → <em>Upload
                  font</em>. Format yang didukung: <code>.woff2</code>,{' '}
               <code>.woff</code>, <code>.ttf</code>, <code>.otf</code>. Font
               tersimpan di localStorage.
            </p>

            <h3>
               <Zap size={14} /> Atur font size cepat
            </h3>
            <p>
               Buka panel Settings editor (ikon sliders), atur{' '}
               <strong>Font size</strong> dan <strong>Line height</strong>{' '}
               sesuai kenyamanan. Tidak perlu restart — langsung terasa.
            </p>

            <h3>
               <Zap size={14} /> Ganti bahasa highlighting manual
            </h3>
            <p>
               Kadang file tanpa ekstensi (mis. <code>Dockerfile</code>) tidak
               terdeteksi otomatis. Klik indikator bahasa di bottom bar editor,
               pilih bahasa manual.
            </p>

            <h3>
               <Zap size={14} /> B2: gunakan passcode untuk setup cepat
            </h3>
            <p>
               Kalau sering ganti device atau browser, simpan config B2 di{' '}
               <code>.env</code> dan pakai fitur passcode. Sekali klik, semua
               terisi.
            </p>
            <Hint variant="warning">
               Fitur passcode hanya aman di <strong>localhost</strong>. Jangan
               aktifkan kalau kamu deploy editor ini ke publik.
            </Hint>

            <h3>
               <Zap size={14} /> Backup berlapis
            </h3>
            <p>
               Strategi aman:
            </p>
            <ol>
               <li>
                  Kerja di <strong>Local</strong> untuk kecepatan.
               </li>
               <li>
                  Push ke <strong>GitHub</strong> untuk versioning.
               </li>
               <li>
                  Push ke <strong>B2</strong> untuk backup tambahan.
               </li>
            </ol>
            <p>
               Tiga mode ini <strong>terpisah</strong> — masing-masing punya
               snapshot sendiri. Kamu bisa switch kapan saja.
            </p>

            <h3>
               <Zap size={14} /> Keyboard shortcut penting
            </h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Shortcut</th>
                     <th>Aksi</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>S</kbd>
                     </td>
                     <td>Save file</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>W</kbd>
                     </td>
                     <td>Tutup tab</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Ctrl</kbd> + <kbd>F</kbd>
                     </td>
                     <td>Search</td>
                  </tr>
                  <tr>
                     <td>
                        <kbd>Esc</kbd>
                     </td>
                     <td>Tutup dialog</td>
                  </tr>
               </tbody>
            </table>
         </>
      ),
   },

   /* ===================== 10. Tentang ===================== */
   {
      id: 'about',
      title: 'Tentang',
      content: (
         <>
            <h2>Tentang Eggs</h2>
            <p>
               <strong>Eggs</strong> adalah editor kode mini berbasis browser
               dengan integrasi cloud storage. Dibuat untuk memudahkan edit
               file kode dari mana saja tanpa install apa pun.
            </p>

            <h3>
               <Sparkles size={14} /> Fitur
            </h3>
            <ul>
               <li>Editor CodeMirror 6 dengan syntax highlighting 20+ bahasa</li>
               <li>File manager dengan drag & drop</li>
               <li>Multi-tab editing</li>
               <li>Markdown preview real-time</li>
               <li>Integrasi GitHub (device flow + PAT)</li>
               <li>Integrasi Backblaze B2 (S3-compatible)</li>
               <li>Custom font upload</li>
               <li>Dark & light mode</li>
               <li>Mobile-friendly (drawer panel)</li>
            </ul>

            <h3>
               <BookOpen size={14} /> Teknologi
            </h3>
            <table className="help__table">
               <thead>
                  <tr>
                     <th>Komponen</th>
                     <th>Library</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>UI Framework</td>
                     <td>React 18 + TypeScript</td>
                  </tr>
                  <tr>
                     <td>Build tool</td>
                     <td>Vite</td>
                  </tr>
                  <tr>
                     <td>Editor</td>
                     <td>CodeMirror 6</td>
                  </tr>
                  <tr>
                     <td>GitHub API</td>
                     <td>Octokit REST</td>
                  </tr>
                  <tr>
                     <td>B2 API</td>
                     <td>AWS SDK v3 (S3-compatible)</td>
                  </tr>
                  <tr>
                     <td>Icons</td>
                     <td>Lucide React</td>
                  </tr>
                  <tr>
                     <td>Markdown</td>
                     <td>React Markdown + Remark GFM</td>
                  </tr>
               </tbody>
            </table>

            <h3>
               <BookOpen size={14} /> Storage modes
            </h3>
            <ul>
               <li>
                  <strong>Local</strong> — localStorage browser (ephemeral)
               </li>
               <li>
                  <strong>GitHub</strong> — repository GitHub (versioned via
                  git)
               </li>
               <li>
                  <strong>Backblaze B2</strong> — object storage S3-compatible
               </li>
            </ul>

            <h3>
               <BookOpen size={14} /> Batasan
            </h3>
            <ul>
               <li>
                  File binary (gambar, video) tidak di-handle — hanya file
                  teks.
               </li>
               <li>
                  Ukuran file maksimum saat pull: <strong>500 KB</strong> per
                  file.
               </li>
               <li>
                  GitHub API: rate limit 5000 request/jam untuk authenticated
                  user.
               </li>
               <li>
                  B2: egress gratis 3× rata-rata storage bulanan.
               </li>
            </ul>

            <h3>
               <BookOpen size={14} /> Lisensi & kredit
            </h3>
            <p>
               Editor ini dibangun di atas open-source library. Terima kasih
               untuk React, CodeMirror, Lucide, Octokit, dan komunitas
               open-source.
            </p>

            <Hint variant="success">
               <strong>Selamat berkarya!</strong> Kalau ada pertanyaan atau
               masalah, cek section <em>Troubleshooting</em> dan{' '}
               <em>FAQ</em> dulu.
            </Hint>
         </>
      ),
   },
];