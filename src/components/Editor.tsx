import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { githubLight } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
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
import { undo, redo } from '@codemirror/commands';
import { forEachDiagnostic } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import type { FileItem, Theme, EditorSettings } from '../types';
import {
   findLanguage,
   loadLanguageExtension,
   resolveLanguage,
} from '../languages';
import { lintExtensions } from '../editorLint';
import { EditorStatusBar } from './EditorStatusBar';

const MarkdownPreview = lazy(() =>
   import('./MarkdownPreview').then((m) => ({ default: m.MarkdownPreview }))
);

type Props = {
   file: FileItem;
   fontFamily: string;
   theme: Theme;
   settings: EditorSettings;
   previewOpen: boolean;
   onChange: (content: string) => void;
   /** user pilih bahasa manual dari dropdown di status bar */
   onLanguageOverrideChange: (id: string | null) => void;
   /** Naikkan nilainya untuk force remount CodeMirror (mis. saat discard) */
   resetKey: number;
};

export function Editor({
   file,
   fontFamily,
   theme,
   settings,
   previewOpen,
   onChange,
   onLanguageOverrideChange,
   resetKey,
}: Props) {
   const viewRef = useRef<EditorView | null>(null);
   const cmRef = useRef<ReactCodeMirrorRef>(null);

   const [cursor, setCursor] = useState({ line: 1, col: 1 });
   const [lintCount, setLintCount] = useState({ errors: 0, warnings: 0 });
   const [langExtension, setLangExtension] = useState<Extension | null>(null);
   const [editorKey, setEditorKey] = useState(0);
   const [actionMessage, setActionMessage] = useState<string | null>(null);

   /* ---------- bahasa efektif ---------- */
   const autoLang = useMemo(() => findLanguage(file.name), [file.name]);
   const override = file.languageOverride ?? null;
   const lang = useMemo(
      () => resolveLanguage(file.name, override),
      [file.name, override]
   );

   /* ---------- force remount saat file.id / resetKey / bahasa override berubah ---------- */
   useEffect(() => {
      setEditorKey((k) => k + 1);
   }, [file.id, resetKey, override]);

   /* ---------- load bahasa secara lazy (dengan cache) ---------- */
   useEffect(() => {
      if (!lang.load) {
         setLangExtension(null);
         return;
      }

      let cancelled = false;
      loadLanguageExtension(lang.id, lang.load).then((ext) => {
         if (!cancelled) setLangExtension(ext);
      });

      return () => {
         cancelled = true;
      };
   }, [lang.id, lang.load]);

   const extensions = useMemo(() => {
      const exts = [];

      if (langExtension) exts.push(langExtension);
      if (settings.autocomplete) exts.push(autocompletion());

      exts.push(search({ top: true }));

      /* ---------- linting ---------- */
      if (settings.linting) exts.push(...lintExtensions());

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
      if (settings.indentGuides) {
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
      }

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
   }, [langExtension, settings, fontFamily]);

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

   const codeMirrorTheme = useMemo(() => {
      return theme === 'dark' ? vscodeDark : githubLight;
   }, [theme]);

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

   /* ---------- action helpers (mobile bottom bar) ---------- */

   const flashMessage = (msg: string) => {
      setActionMessage(msg);
      window.setTimeout(() => {
         setActionMessage((cur) => (cur === msg ? null : cur));
      }, 2000);
   };

   const doUndo = () => {
      const view = viewRef.current;
      if (!view) return;
      undo(view);
      view.focus();
   };

   const doRedo = () => {
      const view = viewRef.current;
      if (!view) return;
      redo(view);
      view.focus();
   };

   const doSelectAll = () => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
         selection: { anchor: 0, head: view.state.doc.length },
      });
      view.focus();
   };

   const doCopy = async () => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      if (from === to) {
         flashMessage('Tidak ada teks yang dipilih.');
         return;
      }
      const text = view.state.sliceDoc(from, to);
      try {
         await navigator.clipboard.writeText(text);
         flashMessage('Tersalin.');
      } catch {
         flashMessage('Gagal menyalin.');
      }
      view.focus();
   };

   const doCut = async () => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      if (from === to) {
         flashMessage('Tidak ada teks yang dipilih.');
         return;
      }
      const text = view.state.sliceDoc(from, to);
      try {
         await navigator.clipboard.writeText(text);
      } catch {
         flashMessage('Gagal memotong.');
         return;
      }
      view.dispatch({
         changes: { from, to, insert: '' },
         selection: { anchor: from },
      });
      flashMessage('Dipindahkan.');
      view.focus();
   };

   const doPaste = async () => {
      const view = viewRef.current;
      if (!view) return;
      try {
         const text = await navigator.clipboard.readText();
         if (!text) {
            flashMessage('Clipboard kosong.');
            return;
         }
         const { from, to } = view.state.selection.main;
         view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
         });
         view.focus();
      } catch {
         /* clipboard.readText tidak diizinkan */
         view.focus();
         flashMessage('Paste tidak didukung. Tekan lama di editor.');
      }
   };

   const insertPair = (open: string, close: string) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.sliceDoc(from, to);
      const insert = open + selected + close;
      const cursorPos = from + open.length + selected.length;
      view.dispatch({
         changes: { from, to, insert },
         selection: { anchor: cursorPos },
      });
      view.focus();
   };

   const handleInsertBrackets = () => insertPair('[', ']');
   const handleInsertQuotes = () => insertPair('"', '"');

   /* ---------- insert koma + spasi ---------- */
   const handleInsertComma = () => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const insert = ', ';
      view.dispatch({
         changes: { from, to, insert },
         selection: { anchor: from + insert.length },
      });
      view.focus();
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
                  key={editorKey}
                  ref={cmRef}
                  value={file.content}
                  height="100%"
                  theme={codeMirrorTheme}
                  extensions={extensions}
                  editable={true}
                  basicSetup={{
                     foldGutter: false,
                     lineNumbers: settings.lineNumbers,
                     autocompletion: false,
                     highlightActiveLine: settings.highlightActiveLine,
                     closeBrackets: settings.closeBrackets,
                  }}
                  onChange={onChange}
                  onUpdate={handleUpdate}
                  onCreateEditor={(view) => {
                     viewRef.current = view;
                  }}
               />
            </div>

            {previewOpen && (
               <div className="editor-split__pane editor-split__pane--preview">
                  <Suspense fallback={null}>
                     <MarkdownPreview
                        content={file.content}
                        fontFamily={fontFamily}
                        fontSize={settings.fontSize}
                        lineHeight={settings.lineHeight}
                     />
                  </Suspense>
               </div>
            )}
         </div>

         {actionMessage && (
            <div className="editor-action-toast" role="status">
               {actionMessage}
            </div>
         )}

         <EditorStatusBar
            line={cursor.line}
            col={cursor.col}
            language={lang}
            autoLanguage={autoLang}
            languageOverride={override}
            onChangeLanguage={onLanguageOverrideChange}
            lineCount={lineCount}
            charCount={charCount}
            errors={lintCount.errors}
            warnings={lintCount.warnings}
            onUndo={doUndo}
            onRedo={doRedo}
            onSelectAll={doSelectAll}
            onCopy={() => void doCopy()}
            onCut={() => void doCut()}
            onPaste={() => void doPaste()}
            onInsertComma={handleInsertComma}
            onInsertBrackets={handleInsertBrackets}
            onInsertQuotes={handleInsertQuotes}
         />
      </>
   );
}