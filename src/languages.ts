import type { Extension } from '@codemirror/state';

type LangDef = {
   label: string;
   extensions: string[];
   load: () => Promise<Extension>;
};

const LANGS: LangDef[] = [
   {
      label: 'JavaScript / TypeScript',
      extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
      load: async () => {
         const { javascript } = await import('@codemirror/lang-javascript');
         return javascript({ jsx: true, typescript: true });
      },
   },
   {
      label: 'HTML',
      extensions: ['html', 'htm'],
      load: async () => {
         const { html } = await import('@codemirror/lang-html');
         return html();
      },
   },
   {
      label: 'CSS',
      extensions: ['css'],
      load: async () => {
         const { css } = await import('@codemirror/lang-css');
         return css();
      },
   },
   {
      label: 'JSON',
      extensions: ['json'],
      load: async () => {
         const { json } = await import('@codemirror/lang-json');
         return json();
      },
   },
   {
      label: 'Markdown',
      extensions: ['md', 'markdown'],
      load: async () => {
         const { markdown } = await import('@codemirror/lang-markdown');
         return markdown();
      },
   },
   {
      label: 'Python',
      extensions: ['py'],
      load: async () => {
         const { python } = await import('@codemirror/lang-python');
         return python();
      },
   },
];

export type LanguageInfo = {
   label: string;
   extension: Extension | null;
};

/* ---------- cache: modul-level, tidak di-reset saat komponen re-mount ---------- */
const extensionCache = new Map<string, Extension>();

/** Cari definisi bahasa tanpa load parser. */
export function findLanguage(filename: string): {
   label: string;
   load: (() => Promise<Extension>) | null;
} {
   const dot = filename.lastIndexOf('.');
   if (dot === -1) return { label: 'Plain text', load: null };

   const ext = filename.slice(dot + 1).toLowerCase();
   const match = LANGS.find((l) => l.extensions.includes(ext));

   if (!match) return { label: 'Plain text', load: null };
   return { label: match.label, load: match.load };
}

/**
 * Ambil extension bahasa. Return cached kalau sudah pernah di-load.
 * `extId` = kunci unik (mis. label bahasa).
 */
export async function loadLanguageExtension(
   extId: string,
   loader: () => Promise<Extension>
): Promise<Extension> {
   const cached = extensionCache.get(extId);
   if (cached) return cached;

   const ext = await loader();
   extensionCache.set(extId, ext);
   return ext;
}