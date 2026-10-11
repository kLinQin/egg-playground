import { useCallback, useEffect, useState } from 'react';
import type { FontChoice, StoredFont } from '../types';

export const BUILTIN_FONTS: FontChoice[] = [
   {
      id: 'sans',
      label: 'Sans-serif',
      family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
   },
   {
      id: 'mono',
      label: 'Monospace',
      family: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
   },
   {
      id: 'serif',
      label: 'Serif',
      family: 'Georgia, "Times New Roman", serif',
   },
];

const STORAGE_KEY = 'webden-custom-fonts';
const ACTIVE_KEY = 'webden-active-font';
const ALLOWED_EXT = ['woff2', 'woff', 'ttf', 'otf'];
const MAX_SIZE = 500 * 1024; // 500KB

const MIME_BY_EXT: Record<string, string> = {
   woff2: 'font/woff2',
   woff: 'font/woff',
   ttf: 'font/ttf',
   otf: 'font/otf',
};

/* ---------- util base64 ---------- */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
   const bytes = new Uint8Array(buffer);
   let binary = '';
   const chunk = 0x8000;
   for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(
         ...(bytes.subarray(i, i + chunk) as unknown as number[])
      );
   }
   return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
   const binary = atob(base64);
   const len = binary.length;
   const bytes = new Uint8Array(len);
   for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
   return bytes.buffer;
}

/* ---------- load font ke document ---------- */
async function loadFontFace(
   family: string,
   base64: string,
   mimeType: string
): Promise<void> {
   const dataUri = `data:${mimeType};base64,${base64}`;
   const face = new FontFace(family, `url(${dataUri})`);
   await face.load();
   (document.fonts as FontFaceSet).add(face);
}

/* ---------- baca dari localStorage ---------- */
function readStored(): StoredFont[] {
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredFont[];
      return Array.isArray(parsed) ? parsed : [];
   } catch {
      return [];
   }
}

export function useCustomFonts() {
   const [customFonts, setCustomFonts] = useState<FontChoice[]>([]);
   const [activeId, setActiveId] = useState<string>(() => {
      return localStorage.getItem(ACTIVE_KEY) ?? 'sans';
   });
   const [error, setError] = useState<string | null>(null);
   const [ready, setReady] = useState(false);

   /* ---------- load font tersimpan saat mount ---------- */
   useEffect(() => {
      const stored = readStored();
      if (stored.length === 0) {
         setReady(true);
         return;
      }

      (async () => {
         const loaded: FontChoice[] = [];
         for (const s of stored) {
            try {
               await loadFontFace(s.family, s.dataBase64, s.mimeType);
               loaded.push({
                  id: s.id,
                  label: s.label,
                  family: s.family,
                  dataBase64: s.dataBase64,
                  mimeType: s.mimeType,
               });
            } catch {
               // font korup, skip
            }
         }
         setCustomFonts(loaded);
         setReady(true);
      })();
   }, []);

   /* ---------- simpan activeId ---------- */
   useEffect(() => {
      localStorage.setItem(ACTIVE_KEY, activeId);
   }, [activeId]);

   /* ---------- tambah font dari file ---------- */
   const addFontFromFile = useCallback(async (file: File) => {
      setError(null);

      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXT.includes(ext)) {
         setError(
            `Format .${ext} tidak didukung. Gunakan: ${ALLOWED_EXT.join(', ')}`
         );
         return;
      }

      if (file.size > MAX_SIZE) {
         setError(
            `File terlalu besar (${Math.round(file.size / 1024)}KB). Maks 500KB.`
         );
         return;
      }

      let base64: string;
      try {
         const buf = await file.arrayBuffer();
         base64 = arrayBufferToBase64(buf);
      } catch {
         setError('Gagal membaca file.');
         return;
      }

      const mimeType = MIME_BY_EXT[ext] ?? 'font/ttf';
      const familyName = `custom-${Date.now()}`;

      try {
         await loadFontFace(familyName, base64, mimeType);
      } catch {
         setError('Gagal memuat font. File mungkin korup.');
         return;
      }

      const stored: StoredFont = {
         id: familyName,
         label: file.name,
         family: `"${familyName}"`,
         dataBase64: base64,
         mimeType,
      };

      const nextStored = [...readStored(), stored];
      try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStored));
      } catch {
         setError('Penyimpanan penuh. Hapus font lain dulu.');
         return;
      }

      const choice: FontChoice = {
         id: stored.id,
         label: stored.label,
         family: stored.family,
         dataBase64: stored.dataBase64,
         mimeType: stored.mimeType,
      };

      setCustomFonts((prev) => [...prev, choice]);
      setActiveId(choice.id);
   }, []);

   /* ---------- hapus font custom ---------- */
   const removeFont = useCallback((id: string) => {
      setCustomFonts((prev) => prev.filter((f) => f.id !== id));
      const nextStored = readStored().filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStored));
      setActiveId((curr) => (curr === id ? 'sans' : curr));
   }, []);

   const allFonts = [...BUILTIN_FONTS, ...customFonts];
   const activeFont =
      allFonts.find((f) => f.id === activeId) ?? BUILTIN_FONTS[0];

   return {
      fonts: allFonts,
      activeFont,
      setActiveId,
      addFontFromFile,
      removeFont,
      error,
      clearError: () => setError(null),
      ready,
   };
}