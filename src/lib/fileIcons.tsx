import type { ComponentType } from 'react';
import { FileText } from 'lucide-react';
import {
   SiJavascript,
   SiTypescript,
   SiReact,
   SiHtml5,
   SiCss,
   SiJson,
   SiMarkdown,
   SiPython,
   SiRust,
   SiMysql,
   SiGo,
   SiYaml,
   SiSass,
   SiVuedotjs,
   SiSvelte,
   SiPhp,
   SiCplusplus,
   SiSharp,
   SiRuby,
   SiSwift,
   SiKotlin,
} from 'react-icons/si';

export type FileIconDef = {
   Icon: ComponentType<{ size?: number; className?: string }>;
   color?: string;
};

/* ---------- mapping ekstensi → icon ---------- */
const EXT_MAP: Record<string, FileIconDef> = {
   /* JavaScript / TypeScript */
   js: { Icon: SiJavascript, color: '#f7df1e' },
   mjs: { Icon: SiJavascript, color: '#f7df1e' },
   cjs: { Icon: SiJavascript, color: '#f7df1e' },
   jsx: { Icon: SiReact, color: '#61dafb' },
   ts: { Icon: SiTypescript, color: '#3178c6' },
   tsx: { Icon: SiReact, color: '#61dafb' },

   /* Web */
   html: { Icon: SiHtml5, color: '#e34f26' },
   htm: { Icon: SiHtml5, color: '#e34f26' },
   css: { Icon: SiCss, color: '#1572b6' },
   scss: { Icon: SiSass, color: '#cf649a' },
   sass: { Icon: SiSass, color: '#cf649a' },
   less: { Icon: SiCss, color: '#1d365d' },
   vue: { Icon: SiVuedotjs, color: '#41b883' },
   svelte: { Icon: SiSvelte, color: '#ff3e00' },

   /* Data / Config */
   json: { Icon: SiJson, color: '#cbcb41' },
   yml: { Icon: SiYaml, color: '#cb171e' },
   yaml: { Icon: SiYaml, color: '#cb171e' },

   /* Docs */
   md: { Icon: SiMarkdown, color: '#083fa1' },
   markdown: { Icon: SiMarkdown, color: '#083fa1' },

   /* Backend / Lainnya */
   py: { Icon: SiPython, color: '#3776ab' },
   rs: { Icon: SiRust, color: '#dea584' },
   sql: { Icon: SiMysql, color: '#4479a1' },
   go: { Icon: SiGo, color: '#00add8' },
   php: { Icon: SiPhp, color: '#777bb4' },
   rb: { Icon: SiRuby, color: '#cc342d' },
   swift: { Icon: SiSwift, color: '#fa7343' },
   kt: { Icon: SiKotlin, color: '#7f52ff' },
   cs: { Icon: SiSharp, color: '#239120' },
   cpp: { Icon: SiCplusplus, color: '#00599c' },
   cc: { Icon: SiCplusplus, color: '#00599c' },
   cxx: { Icon: SiCplusplus, color: '#00599c' },
   hpp: { Icon: SiCplusplus, color: '#00599c' },
   h: { Icon: SiCplusplus, color: '#00599c' },
};

/* ---------- mapping nama file khusus ---------- */
const NAME_MAP: Record<string, FileIconDef> = {
   '.gitignore': { Icon: FileText, color: '#f14e32' },
   '.editorconfig': { Icon: FileText },
   'package.json': { Icon: SiJson, color: '#cbcb41' },
   'readme.md': { Icon: SiMarkdown, color: '#083fa1' },
   license: { Icon: FileText },
};

export function getFileIcon(filename: string): FileIconDef {
   const lower = filename.toLowerCase();

   /* cek nama file khusus dulu */
   const basename = lower.split('/').pop() ?? '';
   if (NAME_MAP[basename]) return NAME_MAP[basename];

   /* cek ekstensi */
   const dot = lower.lastIndexOf('.');
   if (dot === -1) return { Icon: FileText };

   const ext = lower.slice(dot + 1);
   return EXT_MAP[ext] ?? { Icon: FileText };
}