import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { indentUnit } from '@codemirror/language';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import {
   search,
   openSearchPanel,
   findNext,
   findPrevious,
} from '@codemirror/search';
import { forEachDiagnostic } from '@codemirror/lint';
import { diffLines } from 'diff';
import type { FileItem, Theme, EditorSettings } from '../types';
import { getLanguage } from '../languages';
import { getEditorTheme } from '../editorThemes';
import { lintExtensions } from '../editorLint';
import {
   lineChangeGutter,
   applyLineChanges,
   type LineChange,
} from '../editorGutter';
import { EditorStatusBar } from './EditorStatusBar';
import { MarkdownPreview } from './MarkdownPreview';

type Props = {
   file: FileItem;
   fontFamily: string;
   theme: Theme;
   settings: EditorSettings;
   previewOpen: boolean;
   onChange: (content: string) => void;
};

/** Hitung baris added/modified dari savedContent vs content. */
function computeLineChanges(
   savedContent: string,
   content: string
): LineChange[] {
   if (savedContent === content) return [];

   const parts = diffLines(savedContent, content);
   const changes: LineChange[] = [];
   let lineNo = 1;

   for (const part of parts) {
      const lineCount = part.count ?? 0;

      if (part.added) {
         // baris baru — tandai hijau
         for (let i = 0; i < lineCount; i++) {
            changes.push({ line: lineNo + i, type: 'added' });
         }
         lineNo += lineCount;
      } else if (part.removed) {
         // baris dihapus — tidak ada di dokumen, skip
         // (tidak menambah lineNo karena baris sudah tidak ada)
      } else {
         // baris tidak berubah — majukan lineNo
         lineNo += lineCount;
      }
   }

   return changes;
}

export function Editor({
   file,
   fontFamily,
   theme,
   settings,
   previewOpen,
   onChange,
}: Props) {
   const lang = getLanguage(file.name);
   const viewRef = useRef<EditorView | null>(null);
   const cmRef = useRef<ReactCodeMirrorRef>(null);

   const [cursor, setCursor] = useState({ line: 1, col: 1 });
   const [lintCount, setLintCount] = useState({ errors: 0, warnings: 0 });

   const extensions = useMemo(() => {
      const exts = [];

      if (lang.extension) exts.push(lang.extension);
      if (settings.autocomplete) exts.push(autocompletion());

      exts.push(search({ top: true }));

      /* ---------- linting ---------- */
      exts.push(...lintExtensions());

      /* ---------- git-like gutter ---------- */
      exts.push(lineChangeGutter());

      /* ---------- indentasi ---------- */
      const indentStr = settings.indentWithTabs
         ? '\t'
         : ' '.repeat(settings.tabSize);
      exts.push(indentUnit.of(indentStr));
      exts.push(
         EditorState.tabSize.of(
            settings.indentWithTabs ? 1 : settings.tabSize
         )
      );

      /* ---------- indent guides + active block highlight ---------- */
      exts.push(
         indentationMarkers({
            highlightActiveBlock: true,
            hideFirstIndent: false,
            thickness: 1,
            colors: {
               light: 'rgba(0, 0, 0, 0.1)',
               dark: 'rgba(255, 255, 255, 0.1)',
               activeLight: 'rgba(0, 0, 0, 0.25)',
               activeDark: 'rgba(255, 255, 255, 0.25)',
            },
         })
      );

      exts.push(
         EditorView.theme({
            '&': {
               fontSize: `${settings.fontSize}px`,
               fontFamily: fontFamily,
            },
            '.cm-content': {
               lineHeight: settings.lineHeight,
               fontFamily: fontFamily,
            },
            '.cm-gutters': settings.lineNumbers
               ? { fontFamily: fontFamily }
               : { display: 'none' },
            '.cm-scroller': {
               fontFamily: fontFamily,
            },
         })
      );

      if (settings.lineWrap) {
         exts.push(EditorView.lineWrapping);
      }

      return exts;
   }, [lang.extension, settings, fontFamily]);

   /* Ctrl+F / Ctrl+H */
   useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
         const mod = e.ctrlKey || e.metaKey;
         if (!mod) return;
         if (e.shiftKey || e.altKey) return;

         const key = e.key.toLowerCase();
         if (key !== 'f' && key !== 'h') return;

         const view = viewRef.current;
         if (!view) return;
         if (!view.hasFocus) return;

         e.preventDefault();
         openSearchPanel(view);

         if (key === 'h') {
            setTimeout(() => {
               const panel = view.dom.querySelector('.cm-panel.cm-search');
               if (!panel) return;
               const inputs = panel.querySelectorAll('input');
               if (inputs[1] instanceof HTMLInputElement) {
                  inputs[1].focus();
               }
            }, 0);
         }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
   }, []);

   /* Enter / Shift+Enter di panel search */
   useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
         const view = viewRef.current;
         if (!view) return;

         const panel = view.dom.querySelector('.cm-panel.cm-search');
         if (!panel) return;
         if (!panel.contains(e.target as Node)) return;

         if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
               findPrevious(view);
            } else {
               findNext(view);
            }
         }
      };

      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
   }, []);

   useEffect(() => {
      setCursor({ line: 1, col: 1 });
   }, [file.id]);

   /* hitung diagnostic setiap file berubah / edit */
   useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const count = () => {
         let errors = 0;
         let warnings = 0;
         forEachDiagnostic(view.state, (d) => {
            if (d.severity === 'error') errors += 1;
            else if (d.severity === 'warning') warnings += 1;
         });
         setLintCount({ errors, warnings });
      };

      count();
      const id = window.setInterval(count, 800);
      return () => window.clearInterval(id);
   }, [file.id, file.content]);

   /* hitung line changes (added/modified) → kirim ke gutter */
   useEffect(() => {
      const view = viewRef.current;
      if (!view) return;

      const changes = computeLineChanges(file.savedContent, file.content);
      applyLineChanges(view, changes);
   }, [file.id, file.content, file.savedContent]);

   const codeMirrorTheme = useMemo(() => {
      const t = getEditorTheme(settings.editorTheme);
      if (t.extension) return t.extension;
      return theme === 'dark' ? oneDark : 'light';
   }, [settings.editorTheme, theme]);

   const handleUpdate = (vu: ViewUpdate) => {
      if (vu.selectionSet || vu.docChanged || vu.focusChanged) {
         const pos = vu.state.selection.main.head;
         const line = vu.state.doc.lineAt(pos);
         setCursor({
            line: line.number,
            col: pos - line.from + 1,
         });
      }
   };

   const lineCount = file.content.split('\n').length;
   const charCount = file.content.length;

   return (
      <>
         <div
            className={`editor-split ${previewOpen ? 'editor-split--preview' : ''
               }`}
         >
            <div className="editor-split__pane editor-split__pane--editor">
               <CodeMirror
                  ref={cmRef}
                  value={file.content}
                  height="100%"
                  theme={codeMirrorTheme}
                  extensions={extensions}
                  editable={true}
                  onChange={onChange}
                  onUpdate={handleUpdate}
                  onCreateEditor={(view) => {
                     viewRef.current = view;
                  }}
               />
            </div>

            <div className="editor-split__pane editor-split__pane--preview">
               <MarkdownPreview
                  content={file.content}
                  fontFamily={fontFamily}
                  fontSize={settings.fontSize}
                  lineHeight={settings.lineHeight}
               />
            </div>
         </div>

         <EditorStatusBar
            line={cursor.line}
            col={cursor.col}
            language={lang.label}
            lineCount={lineCount}
            charCount={charCount}
            errors={lintCount.errors}
            warnings={lintCount.warnings}
         />
      </>
   );
}