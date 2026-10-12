import type { ComponentType, CSSProperties } from 'react';
import type { Extension } from '@codemirror/state';
import { FileText } from 'lucide-react';
import {
   SiJavascript,
   SiHtml5,
   SiCss,
   SiJson,
   SiMarkdown,
   SiPython,
} from 'react-icons/si';

export type LangIcon = ComponentType<{
   size?: number;
   className?: string;
   style?: CSSProperties;
}>;

export type LangDef = {
   /** ID stabil — jangan diubah, dipakai sebagai key override */
   id: string;
   /** label panjang untuk dropdown */
   label: string;
   /** label pendek untuk tampilan collapsed */
   short: string;
   /** ekstensi file yang memicu auto-detect */
   extensions: string[];
   /** icon bahasa */
   Icon: LangIcon;
   /** warna icon (opsional) */
   color?: string;
   /** loader parser CodeMirror; null = plain text */
   load: (() => Promise<Extension>) | null;
};

export const LANGS: LangDef[] = [
   {
      id: 'plaintext',
      label: 'Plain text',
      short: 'Text',
      extensions: [],
      Icon: FileText,
      load: null,
   },
   {
      id: 'js',
      label: 'JavaScript / TypeScript',
      short: 'JS/TS',
      extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
      Icon: SiJavascript,
      color: '#f7df1e',
      load: async () => {
         const { javascript } = await import('@codemirror/lang-javascript');
         return javascript({ jsx: true, typescript: true });
      },
   },
   {
      id: 'html',
      label: 'HTML',
      short: 'HTML',
      extensions: ['html', 'htm'],
      Icon: SiHtml5,
      color: '#e34f26',
      load: async () => {
         const { html } = await import('@codemirror/lang-html');
         return html();
      },
   },
   {
      id: 'css',
      label: 'CSS',
      short: 'CSS',
      extensions: ['css'],
      Icon: SiCss,
      color: '#1572b6',
      load: async () => {
         const { css } = await import('@codemirror/lang-css');
         return css();
      },
   },
   {
      id: 'json',
      label: 'JSON',
      short: 'JSON',
      extensions: ['json'],
      Icon: SiJson,
      color: '#cbcb41',
      load: async () => {
         const { json } = await import('@codemirror/lang-json');
         return json();
      },
   },
   {
      id: 'markdown',
      label: 'Markdown',
      short: 'MD',
      extensions: ['md', 'markdown'],
      Icon: SiMarkdown,
      color: '#083fa1',
      load: async () => {
         const { markdown } = await import('@codemirror/lang-markdown');
         return markdown();
      },
   },
   {
      id: 'python',
      label: 'Python',
      short: 'PY',
      extensions: ['py'],
      Icon: SiPython,
      color: '#3776ab',
      load: async () => {
         const { python } = await import('@codemirror/lang-python');
         return python();
      },
   },
];

/* ---------- fallback: plain text ---------- */
const PLAINTEXT: LangDef = LANGS[0];

/**
 * Cari bahasa berdasarkan nama file (auto-detect).
 * Selalu mengembalikan LangDef (fallback ke plain text).
 */
export function findLanguage(filename: string): LangDef {
   const dot = filename.lastIndexOf('.');
   if (dot === -1) return PLAINTEXT;

   const ext = filename.slice(dot + 1).toLowerCase();
   return LANGS.find((l) => l.extensions.includes(ext)) ?? PLAINTEXT;
}

/**
 * Cari bahasa berdasarkan id (untuk override).
 * Return null kalau tidak ketemu.
 */
export function findLanguageById(id: string): LangDef | null {
   return LANGS.find((l) => l.id === id) ?? null;
}

/**
 * Resolve bahasa efektif untuk sebuah file.
 * - Kalau `overrideId` valid → pakai itu.
 * - Kalau tidak → pakai auto-detect dari nama file.
 */
export function resolveLanguage(
   filename: string,
   overrideId: string | null | undefined
): LangDef {
   if (overrideId) {
      const found = findLanguageById(overrideId);
      if (found) return found;
   }
   return findLanguage(filename);
}

/* ---------- cache: modul-level, tidak di-reset saat komponen re-mount ---------- */
const extensionCache = new Map<string, Extension>();

/**
 * Ambil extension bahasa. Return cached kalau sudah pernah di-load.
 * `extId` = kunci unik (mis. LangDef.id).
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