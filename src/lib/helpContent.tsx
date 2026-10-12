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

            <h3>Dua mode utama</h3>
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
            </ul>

            <h3>Ganti mode</h3>
            <p>
               Klik tombol <strong>Local</strong> atau <strong>GitHub</strong>{' '}
               di tengah toolbar atas. Semua file dari mode saat ini akan
               disimpan sementara, dan file dari mode tujuan akan dimuat.
            </p>

            <p className="help__hint">
               <Lightbulb size={14} />
               <span>
                  Kalau ada perubahan belum disimpan saat ganti mode, akan muncul
                  dialog konfirmasi.
               </span>
            </p>
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

            {/* ===== Device Flow ===== */}
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

            {/* ===== Personal Access Token ===== */}
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

            <p className="help__hint">
               <Lightbulb size={14} />
               <span>
                  <strong>Rekomendasi:</strong> gunakan{' '}
                  <strong>Device Flow</strong> karena lebih aman (token tidak
                  perlu copy-paste manual) dan tidak perlu atur scope sendiri.
                  Gunakan PAT jika Device Flow tidak memungkinkan (mis.
                  jaringan memblokir).
               </span>
            </p>

            <p className="help__hint">
               <Lightbulb size={14} />
               <span>
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
               </span>
            </p>

            {/* ===== Scope ===== */}
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

   /* ===================== 4. Pengaturan Editor ===================== */
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

   /* ===================== 5. Keyboard Shortcuts ===================== */
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
];