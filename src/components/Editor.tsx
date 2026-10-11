import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView, ViewUpdate } from '@codemirror/view';
import {
   search,
   openSearchPanel,
   findNext,
   findPrevious,
} from '@codemirror/search';
import type { FileItem, Theme, EditorSettings } from '../types';
import { getLanguage } from '../languages';
import { getEditorTheme } from '../editorThemes';
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

   const extensions = useMemo(() => {
      const exts = [];
      if (lang.extension) exts.push(lang.extension);
      if (settings.autocomplete) exts.push(autocompletion());
      exts.push(search({ top: true }));
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
      viewRef.current?.dispatch({
         effects: [],
      });
   }, [file.readOnly]);

   useEffect(() => {
      setCursor({ line: 1, col: 1 });
   }, [file.id]);

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
                  editable={!file.readOnly}
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
         />
      </>
   );
}