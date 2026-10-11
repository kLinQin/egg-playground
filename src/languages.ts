import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import type { Extension } from '@codemirror/state';

type LangDef = {
   label: string;
   extensions: string[];
   load: () => Extension;
};

const LANGS: LangDef[] = [
   {
      label: 'JavaScript / TypeScript',
      extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'],
      load: () => javascript({ jsx: true, typescript: true }),
   },
   {
      label: 'HTML',
      extensions: ['html', 'htm'],
      load: () => html(),
   },
   {
      label: 'CSS',
      extensions: ['css'],
      load: () => css(),
   },
   {
      label: 'JSON',
      extensions: ['json'],
      load: () => json(),
   },
   {
      label: 'Markdown',
      extensions: ['md', 'markdown'],
      load: () => markdown(),
   },
   {
      label: 'Python',
      extensions: ['py'],
      load: () => python(),
   },
   {
      label: 'Rust',
      extensions: ['rs'],
      load: () => rust(),
   },
   {
      label: 'SQL',
      extensions: ['sql'],
      load: () => sql(),
   },
   {
      label: 'XML',
      extensions: ['xml'],
      load: () => xml(),
   },
];

export type LanguageInfo = {
   label: string;
   extension: Extension | null;
};

export function getLanguage(filename: string): LanguageInfo {
   const dot = filename.lastIndexOf('.');
   if (dot === -1) return { label: 'Plain text', extension: null };

   const ext = filename.slice(dot + 1).toLowerCase();
   const match = LANGS.find((l) => l.extensions.includes(ext));

   if (!match) return { label: 'Plain text', extension: null };
   return { label: match.label, extension: match.load() };
}