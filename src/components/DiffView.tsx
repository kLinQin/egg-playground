import { useEffect, useMemo, useRef, useState } from 'react';
import { X, FileEdit, FilePlus, FileMinus, FileDiff } from 'lucide-react';
import { MergeView } from '@codemirror/merge';
import {
   EditorState,
   type Extension,
} from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { githubLight } from '@uiw/codemirror-theme-github';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import type { ChangeItem, EditorSettings } from '../types';
import {
   loadLanguageExtension,
   resolveLanguage,
} from '../languages';
import { useEditorExtensions } from '../hooks/useEditorExtensions';

type Props = {
   change: ChangeItem;
   theme: 'light' | 'dark';
   fontFamily: string;
   settings: EditorSettings;
   isMobile: boolean;
   onClose: () => void;
};

function statusIcon(status: ChangeItem['status']) {
   if (status === 'added') return <FilePlus size={14} />;
   if (status === 'deleted') return <FileMinus size={14} />;
   return <FileEdit size={14} />;
}

function statusLabel(status: ChangeItem['status']) {
   if (status === 'added') return 'Added';
   if (status === 'deleted') return 'Deleted';
   if (status === 'renamed') return 'Renamed';
   return 'Modified';
}

/** LCS baris-based sederhana — untuk hitung +add / -del saja. */
function countDiff(left: string[], right: string[]): {
   add: number;
   del: number;
} {
   const n = left.length;
   const m = right.length;
   const dp: number[][] = Array.from({ length: n + 1 }, () =>
      new Array(m + 1).fill(0)
   );
   for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
         dp[i][j] =
            left[i] === right[j]
               ? dp[i + 1][j + 1] + 1
               : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
   }
   let i = 0;
   let j = 0;
   let add = 0;
   let del = 0;
   while (i < n && j < m) {
      if (left[i] === right[j]) {
         i++;
         j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
         del++;
         i++;
      } else {
         add++;
         j++;
      }
   }
   del += n - i;
   add += m - j;
   return { add, del };
}

export function DiffView({
   change,
   theme,
   fontFamily,
   settings,
   isMobile,
   onClose,
}: Props) {
   const hostRef = useRef<HTMLDivElement | null>(null);
   const mergeRef = useRef<MergeView | null>(null);

   const [mobileSide, setMobileSide] = useState<'a' | 'b'>('b');

   const leftText =
      change.file.preEditContent ?? change.file.savedContent;
   const rightText = change.file.content;

   const stats = useMemo(
      () =>
         countDiff(
            leftText.split('\n'),
            rightText.split('\n')
         ),
      [leftText, rightText]
   );

   const leftLines = useMemo(() => leftText.split('\n').length, [leftText]);
   const rightLines = useMemo(() => rightText.split('\n').length, [rightText]);

   const codeMirrorTheme = useMemo<Extension>(
      () => (theme === 'dark' ? vscodeDark : githubLight),
      [theme]
   );

   const lang = useMemo(
      () =>
         resolveLanguage(
            change.file.name,
            change.file.languageOverride ?? null
         ),
      [change.file.name, change.file.languageOverride]
   );

   const [langExtension, setLangExtension] = useState<Extension | null>(null);

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

   const extensions = useEditorExtensions({
      settings,
      fontFamily,
      langExtension,
      readOnly: true,
   });

   useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      if (lang.load && !langExtension) return;

      const baseExt: Extension[] = [
         ...extensions,
         codeMirrorTheme,
         EditorState.readOnly.of(true),
         EditorView.editable.of(false),
      ];

      const merge = new MergeView({
         a: { doc: leftText, extensions: baseExt },
         b: { doc: rightText, extensions: baseExt },
         parent: host,
         orientation: 'a-b',
         highlightChanges: true,
         gutter: true,
         collapseUnchanged: { margin: 3, minSize: 4 },
      });

      mergeRef.current = merge;

      return () => {
         merge.destroy();
         mergeRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [change.file.id, extensions, codeMirrorTheme, langExtension]);

   return (
      <div
         className={`diff-view ${isMobile ? `diff-view--mobile diff-view--mobile-${mobileSide}` : ''
            }`}
      >
         <div className="diff-view__header">
            {statusIcon(change.status)}
            <span className="diff-view__title" title={change.file.name}>
               {change.file.name}
            </span>
            <span
               className={`diff-view__status diff-view__status--${change.status}`}
            >
               {statusLabel(change.status)}
            </span>

            {isMobile && (
               <div
                  className="source-switch diff-view__side-switch"
                  role="tablist"
                  aria-label="Versi diff"
               >
                  <button
                     type="button"
                     role="tab"
                     aria-selected={mobileSide === 'a'}
                     className={`source-switch__btn ${mobileSide === 'a' ? 'source-switch__btn--active' : ''
                        }`}
                     onClick={() => setMobileSide('a')}
                  >
                     Sebelum
                  </button>
                  <button
                     type="button"
                     role="tab"
                     aria-selected={mobileSide === 'b'}
                     className={`source-switch__btn ${mobileSide === 'b' ? 'source-switch__btn--active' : ''
                        }`}
                     onClick={() => setMobileSide('b')}
                  >
                     Sesudah
                  </button>
               </div>
            )}

            <button className="icon-btn" onClick={onClose} title="Tutup diff">
               <X size={16} />
            </button>
         </div>

         <div className="diff-view__body" ref={hostRef} />

         <div className="status-bar status-bar--panel">
            <FileDiff size={11} />
            <span className="status-bar__item">diff</span>
            <span className="status-bar__sep" />
            <span className="status-bar__item">{change.file.name}</span>
            <span className="status-bar__spacer" />
            {stats.add > 0 && (
               <span className="status-bar__item diff-view__stat-add">
                  +{stats.add}
               </span>
            )}
            {stats.del > 0 && (
               <span className="status-bar__item diff-view__stat-del">
                  −{stats.del}
               </span>
            )}
            <span className="status-bar__sep" />
            <span className="status-bar__item">
               {leftLines} → {rightLines}
            </span>
         </div>
      </div>
   );
}