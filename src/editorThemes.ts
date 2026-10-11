import {
   githubLight,
   xcodeLight,
   solarizedLight,
   materialLight,
   eclipse,
   sublime,
   dracula,
   nord,
   monokai,
   tokyoNight,
   githubDark,
   materialDark,
   vscodeDark,
   solarizedDark,
} from '@uiw/codemirror-themes-all';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Extension } from '@codemirror/state';
import type { EditorTheme } from './types';

export type EditorThemeDef = {
   id: EditorTheme;
   label: string;
   /** null = ikut UI theme (auto) */
   extension: Extension | null;
};

export const EDITOR_THEMES: EditorThemeDef[] = [
   { id: 'auto', label: 'Auto (ikut UI)', extension: null },

   /* ---------- Light ---------- */
   { id: 'githubLight', label: 'GitHub Light', extension: githubLight },
   { id: 'xcodeLight', label: 'Xcode Light', extension: xcodeLight },
   {
      id: 'solarizedLight',
      label: 'Solarized Light',
      extension: solarizedLight,
   },
   {
      id: 'materialLight',
      label: 'Material Light',
      extension: materialLight,
   },
   { id: 'eclipse', label: 'Eclipse', extension: eclipse },
   { id: 'sublime', label: 'Sublime', extension: sublime },

   /* ---------- Dark ---------- */
   { id: 'oneDark', label: 'One Dark', extension: oneDark },
   { id: 'dracula', label: 'Dracula', extension: dracula },
   { id: 'nord', label: 'Nord', extension: nord },
   { id: 'monokai', label: 'Monokai', extension: monokai },
   { id: 'tokyoNight', label: 'Tokyo Night', extension: tokyoNight },
   { id: 'githubDark', label: 'GitHub Dark', extension: githubDark },
   {
      id: 'materialDark',
      label: 'Material Dark',
      extension: materialDark,
   },
   { id: 'vscodeDark', label: 'VS Code Dark', extension: vscodeDark },
   {
      id: 'solarizedDark',
      label: 'Solarized Dark',
      extension: solarizedDark,
   },
];

export function getEditorTheme(id: EditorTheme): EditorThemeDef {
   return EDITOR_THEMES.find((t) => t.id === id) ?? EDITOR_THEMES[0];
}