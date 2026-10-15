import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { githubLight } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import {
   openSearchPanel,
   closeSearchPanel,
   searchPanelOpen,
   findNext,
   findPrevious,
} from '@codemirror/search';
import {
   undo,
   redo,
   insertNewlineAndIndent,
   deleteCharBackward,
   selectLine,
} from '@codemirror/commands';
import { forEachDiagnostic } from '@codemirror/lint';
import type { FileItem, Theme, EditorSettings } from '../types';
import {
   findLanguage,
   loadLanguageExtension,
   resolveLanguage,
} from '../languages';
import { useEditorExtensions } from '../hooks/useEditorExtensions';
import { EditorStatusBar } from './EditorStatusBar';

const MarkdownPreview = lazy(() =>
   import('./MarkdownPreview').then((m) => ({ default: m.MarkdownPreview }))
);

export type EditorViewState = {
   anchor: number;
   head: number;
   scrollTop: number;
};

export type SelectMode = 'word' | 'line' | null;

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

   /* ---------- view-state per tab (cursor + scroll) ---------- */
   onSaveViewState: (fileId: string, state: EditorViewState) => void;
   initialViewState?: EditorViewState;

   /* ---------- keyboard lock toggle ---------- */
   onToggleKeyboardLock: () => void;
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
   onSaveViewState,
   initialViewState,
   onToggleKeyboardLock,
}: Props) {
   const viewRef = useRef<EditorView | null>(null);
   const cmRef = useRef<ReactCodeMirrorRef>(null);

   /* simpan fileId & callback di ref supaya cleanup pakai nilai terbaru */
   const saveStateRef = useRef({ fileId: file.id, onSave: onSaveViewState });
   useEffect(() => {
      saveStateRef.current = { fileId: file.id, onSave: onSaveViewState };
   }, [file.id, onSaveViewState]);

   /* simpan state saat file.id berubah / unmount */
   useEffect(() => {
      return () => {
         const view = viewRef.current;
         if (!view) return;
         const sel = view.state.selection.main;
         saveStateRef.current.onSave(saveStateRef.current.fileId, {
            anchor: sel.anchor,
            head: sel.head,
            scrollTop: view.scrollDOM.scrollTop,
         });
      };
   }, [file.id]);

   const [cursor, setCursor] = useState({ line: 1, col: 1 });
   const [lintCount, setLintCount] = useState({ errors: 0, warnings: 0 });
   const [langExtension, setLangExtension] = useState<Extension | null>(null);
   const [editorKey, setEditorKey] = useState(0);
   const [actionMessage, setActionMessage] = useState<string | null>(null);
   const [selectMode, setSelectMode] = useState<SelectMode>(null);

   /* guard supaya update seleksi otomatis tidak memicu loop */
   const applyingSelectRef = useRef(false);
   /* selectMode versi ref — dibaca di handleUpdate (closure lama) */
   const selectModeRef = useRef<SelectMode>(null);
   useEffect(() => {
      selectModeRef.current = selectMode;
   }, [selectMode]);

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

   /* ---------- reset selectMode saat pindah file ---------- */
   useEffect(() => {
      setSelectMode(null);
   }, [file.id]);

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

   /* ---------- extensions (dari hook bersama) ---------- */
   const extensions = useEditorExtensions({
      settings,
      fontFamily,
      langExtension,
   });

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

   /* ---------- select word helper (dipakai one-shot & mode) ---------- */
   const computeWordRange = (
      view: EditorView,
      pos: number
   ): { from: number; to: number } | null => {
      const doc = view.state.doc;
      const isWordChar = (ch: string) => /[A-Za-z0-9_]/.test(ch);

      let anchor = pos;
      if (anchor === doc.length && anchor > 0) {
         const prev = doc.sliceString(anchor - 1, anchor);
         if (isWordChar(prev)) anchor -= 1;
      }

      let from = anchor;
      let to = anchor;

      while (from > 0) {
         const ch = doc.sliceString(from - 1, from);
         if (!isWordChar(ch)) break;
         from -= 1;
      }
      while (to < doc.length) {
         const ch = doc.sliceString(to, to + 1);
         if (!isWordChar(ch)) break;
         to += 1;
      }

      if (from === to) return null;
      return { from, to };
   };

   const handleUpdate = (vu: ViewUpdate) => {
      if (vu.selectionSet || vu.docChanged || vu.focusChanged) {
         const pos = vu.state.selection.main.head;
         const line = vu.state.doc.lineAt(pos);
         setCursor({
            line: line.number,
            col: pos - line.from + 1,
         });
      }

      /* mode Word/Line: seleksi mengikuti cursor */
      const mode = selectModeRef.current;
      if (
         mode &&
         vu.selectionSet &&
         !applyingSelectRef.current &&
         !vu.docChanged
      ) {
         const view = viewRef.current;
         if (!view) return;
         const pos = view.state.selection.main.head;

         applyingSelectRef.current = true;
         try {
            if (mode === 'word') {
               const range = computeWordRange(view, pos);
               if (range) {
                  view.dispatch({
                     selection: EditorSelection.single(
                        range.from,
                        range.to
                     ),
                  });
               }
            } else if (mode === 'line') {
               const line = view.state.doc.lineAt(pos);
               view.dispatch({
                  selection: EditorSelection.single(
                     line.from,
                     line.to
                  ),
               });
            }
         } finally {
            applyingSelectRef.current = false;
         }
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
      setSelectMode(null);
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
         selection: { anchor: 0, head: view.state.doc.length },
      });
      view.focus();
   };

   /* ---------- toggle select word/line ---------- */
   const toggleSelectWord = () => {
      const view = viewRef.current;
      if (!view) return;
      if (selectMode === 'word') {
         setSelectMode(null);
         return;
      }
      setSelectMode('word');
      const pos = view.state.selection.main.head;
      const range = computeWordRange(view, pos);
      if (range) {
         applyingSelectRef.current = true;
         try {
            view.dispatch({
               selection: EditorSelection.single(range.from, range.to),
            });
         } finally {
            applyingSelectRef.current = false;
         }
      }
      view.focus();
   };

   const toggleSelectLine = () => {
      const view = viewRef.current;
      if (!view) return;
      if (selectMode === 'line') {
         setSelectMode(null);
         return;
      }
      setSelectMode('line');
      selectLine(view);
      view.focus();
   };

   const doCopy = async () => {
      setSelectMode(null);
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
      setSelectMode(null);
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
      setSelectMode(null);
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
      setSelectMode(null);
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
      setSelectMode(null);
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

   /* ---------- insert spasi ---------- */
   const handleInsertSpace = () => {
      setSelectMode(null);
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const insert = ' ';
      view.dispatch({
         changes: { from, to, insert },
         selection: { anchor: from + insert.length },
      });
      view.focus();
   };

   /* ---------- insert newline + auto-indent ---------- */
   const handleInsertEnter = () => {
      setSelectMode(null);
      const view = viewRef.current;
      if (!view) return;
      insertNewlineAndIndent(view);
      view.focus();
   };

   /* ---------- backspace ---------- */
   const handleBackspace = () => {
      setSelectMode(null);
      const view = viewRef.current;
      if (!view) return;
      deleteCharBackward(view);
      view.focus();
   };

   /* ---------- arrow keys (selectMode tetap aktif, tetap jalan saat keyboard locked) ---------- */

   /* Gerakkan kursor lewat dispatch selection langsung,
      supaya tetap bekerja meski view tidak editable. */
   const moveCursor = (head: number) => {
      const view = viewRef.current;
      if (!view) return;
      const max = view.state.doc.length;
      const target = Math.max(0, Math.min(max, head));
      view.dispatch({ selection: { anchor: target } });
   };

   const handleArrowLeft = () => {
      const view = viewRef.current;
      if (!view) return;
      moveCursor(view.state.selection.main.head - 1);
   };

   const handleArrowRight = () => {
      const view = viewRef.current;
      if (!view) return;
      moveCursor(view.state.selection.main.head + 1);
   };

   const handleArrowUp = () => {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(pos);
      if (line.number <= 1) return;
      const prev = view.state.doc.line(line.number - 1);
      const col = pos - line.from;
      moveCursor(Math.min(prev.to, prev.from + col));
   };

   const handleArrowDown = () => {
      const view = viewRef.current;
      if (!view) return;
      const pos = view.state.selection.main.head;
      const line = view.state.doc.lineAt(pos);
      if (line.number >= view.state.doc.lines) return;
      const next = view.state.doc.line(line.number + 1);
      const col = pos - line.from;
      moveCursor(Math.min(next.to, next.from + col));
   };

   /* ---------- toggle search panel ---------- */
   const handleSearch = () => {
      const view = viewRef.current;
      if (!view) return;
      if (searchPanelOpen(view.state)) {
         closeSearchPanel(view);
      } else {
         openSearchPanel(view);
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
                  key={editorKey}
                  ref={cmRef}
                  value={file.content}
                  height="100%"
                  theme={codeMirrorTheme}
                  extensions={extensions}
                  editable={!settings.keyboardLocked}
                  basicSetup={false}
                  onChange={onChange}
                  onUpdate={handleUpdate}
                  onCreateEditor={(view) => {
                     viewRef.current = view;

                     /* restore posisi cursor + scroll dari state terakhir tab */
                     if (initialViewState) {
                        const { anchor, head, scrollTop } =
                           initialViewState;
                        const maxPos = view.state.doc.length;
                        const safeAnchor = Math.min(anchor, maxPos);
                        const safeHead = Math.min(head, maxPos);
                        view.dispatch({
                           selection: {
                              anchor: safeAnchor,
                              head: safeHead,
                           },
                        });
                        requestAnimationFrame(() => {
                           view.scrollDOM.scrollTop = scrollTop;
                        });
                     }
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
            keyboardLocked={settings.keyboardLocked}
            onToggleKeyboardLock={onToggleKeyboardLock}
            selectMode={selectMode}
            onUndo={doUndo}
            onRedo={doRedo}
            onSelectAll={doSelectAll}
            onSelectWord={toggleSelectWord}
            onSelectLine={toggleSelectLine}
            onCopy={() => void doCopy()}
            onCut={() => void doCut()}
            onPaste={() => void doPaste()}
            onInsertComma={handleInsertComma}
            onInsertBrackets={handleInsertBrackets}
            onInsertQuotes={handleInsertQuotes}
            onInsertSpace={handleInsertSpace}
            onInsertEnter={handleInsertEnter}
            onBackspace={handleBackspace}
            onArrowLeft={handleArrowLeft}
            onArrowRight={handleArrowRight}
            onArrowUp={handleArrowUp}
            onArrowDown={handleArrowDown}
            onSearch={handleSearch}
         />
      </>
   );
}