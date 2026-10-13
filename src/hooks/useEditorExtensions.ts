import { useMemo } from 'react';
import {
   EditorView,
   lineNumbers,
   highlightActiveLine,
   highlightActiveLineGutter,
   highlightSpecialChars,
   drawSelection,
   dropCursor,
   rectangularSelection,
   crosshairCursor,
   keymap,
} from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import {
   indentUnit,
   indentOnInput,
   bracketMatching,
   syntaxHighlighting,
   defaultHighlightStyle,
   foldGutter,
   foldKeymap,
} from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import type { EditorSettings } from '../types';
import { lintExtensions } from '../editorLint';

type Options = {
   settings: EditorSettings;
   fontFamily: string;
   langExtension: Extension | null;
   /** true → untuk DiffView (read-only): skip autocomplete, lint, closeBrackets, history */
   readOnly?: boolean;
};

export function useEditorExtensions({
   settings,
   fontFamily,
   langExtension,
   readOnly = false,
}: Options): Extension[] {
   return useMemo(() => {
      const exts: Extension[] = [];

      /* ---------- basic setup (setara basicSetup @uiw/react-codemirror) ---------- */
      exts.push(
         highlightSpecialChars(),
         drawSelection(),
         dropCursor(),
         EditorState.allowMultipleSelections.of(true),
         indentOnInput(),
         syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
         bracketMatching(),
         rectangularSelection(),
         crosshairCursor(),
         highlightSelectionMatches()
      );

      /* ---------- history (undo/redo) — hanya mode editable ---------- */
      if (!readOnly) {
         exts.push(history());
      }

      /* ---------- line numbers ---------- */
      if (settings.lineNumbers) {
         exts.push(lineNumbers());
      }

      /* ---------- active line highlight ---------- */
      if (settings.highlightActiveLine && !readOnly) {
         exts.push(highlightActiveLineGutter());
         exts.push(highlightActiveLine());
      }

      /* ---------- fold gutter ---------- */
      exts.push(foldGutter());

      /* ---------- close brackets ---------- */
      if (!readOnly && settings.closeBrackets) {
         exts.push(closeBrackets());
      }

      /* ---------- keymap ---------- */
      const keys = [
         ...closeBracketsKeymap,
         ...defaultKeymap,
         ...searchKeymap,
         ...historyKeymap,
         ...foldKeymap,
         ...completionKeymap,
         ...lintKeymap,
      ];
      if (readOnly) {
         /* mode read-only: cukup keymap pencarian & fold */
         exts.push(keymap.of([...searchKeymap, ...foldKeymap]));
      } else {
         exts.push(keymap.of(keys));
      }

      /* ---------- bahasa ---------- */
      if (langExtension) exts.push(langExtension);

      /* ---------- autocomplete ---------- */
      if (!readOnly && settings.autocomplete) {
         exts.push(autocompletion());
      }

      /* ---------- search panel ---------- */
      exts.push(search({ top: true }));

      /* ---------- linting ---------- */
      if (!readOnly && settings.linting) {
         exts.push(...lintExtensions());
      }

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

      /* ---------- indent guides ---------- */
      if (settings.indentGuides) {
         exts.push(
            indentationMarkers({
               highlightActiveBlock: !readOnly,
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

      /* ---------- theme: font + line-height ---------- */
      exts.push(
         EditorView.theme({
            '&': {
               fontSize: `${settings.fontSize}px`,
               fontFamily: fontFamily,
            },
            '.cm-content': {
               lineHeight: String(settings.lineHeight),
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
   }, [settings, fontFamily, langExtension, readOnly]);
}