import { useEffect, useRef, useState } from 'react';
import {
   Check,
   Wrench,
   X,
   Undo2,
   Redo2,
   TextSelect,
   Copy,
   Scissors,
   Clipboard,
   Brackets,
   Quote,
} from 'lucide-react';
import type { LangDef } from '../languages';
import { LANGS } from '../languages';

type Props = {
   line: number;
   col: number;
   language: LangDef;
   autoLanguage: LangDef;
   languageOverride: string | null;
   onChangeLanguage: (id: string | null) => void;
   lineCount: number;
   charCount: number;
   errors?: number;
   warnings?: number;

   /* mobile action bar */
   onUndo: () => void;
   onRedo: () => void;
   onSelectAll: () => void;
   onCopy: () => void;
   onCut: () => void;
   onPaste: () => void;
   onInsertComma: () => void;
   onInsertBrackets: () => void;
   onInsertQuotes: () => void;
};

export function EditorStatusBar({
   line,
   col,
   language,
   autoLanguage,
   languageOverride,
   onChangeLanguage,
   lineCount,
   charCount,
   errors = 0,
   warnings = 0,
   onUndo,
   onRedo,
   onSelectAll,
   onCopy,
   onCut,
   onPaste,
   onInsertComma,
   onInsertBrackets,
   onInsertQuotes,
}: Props) {
   const hasErrors = errors > 0;
   const hasWarnings = warnings > 0;

   const [open, setOpen] = useState(false);
   const rootRef = useRef<HTMLDivElement>(null);

   /* ---------- mode aksi (replace bottom bar) ---------- */
   const [actionsMode, setActionsMode] = useState(false);

   /* close dropdown bahasa on outside click */
   useEffect(() => {
      if (!open) return;

      const onDocDown = (e: MouseEvent) => {
         if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
            setOpen(false);
         }
      };
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setOpen(false);
      };

      document.addEventListener('mousedown', onDocDown);
      document.addEventListener('keydown', onKey);
      return () => {
         document.removeEventListener('mousedown', onDocDown);
         document.removeEventListener('keydown', onKey);
      };
   }, [open]);

   /* Escape → keluar dari mode aksi */
   useEffect(() => {
      if (!actionsMode) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setActionsMode(false);
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
   }, [actionsMode]);

   const runAction = (fn: () => void) => {
      fn();
      /* tetap di mode aksi — user bisa pilih aksi lain */
   };

   const CurrentIcon = language.Icon;

   /* ===================== MODE AKSI ===================== */
   if (actionsMode) {
      return (
         <div className="status-bar">
            {/* ---------- X — di posisi yang sama dengan Wrench ---------- */}
            <div className="status-bar__actions">
               <button
                  type="button"
                  className="status-bar__actions-btn is-active"
                  onClick={() => setActionsMode(false)}
                  title="Tutup aksi editor"
                  aria-label="Tutup aksi editor"
               >
                  <X size={12} />
               </button>
            </div>

            <span className="status-bar__sep" />

            <div className="status-bar__action-scroll">
               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onUndo)}
                  title="Undo"
                  aria-label="Undo"
               >
                  <Undo2 size={14} />
                  <span>Undo</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onRedo)}
                  title="Redo"
                  aria-label="Redo"
               >
                  <Redo2 size={14} />
                  <span>Redo</span>
               </button>

               <span className="status-bar__action-sep" />

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onSelectAll)}
                  title="Select All"
                  aria-label="Select All"
               >
                  <TextSelect size={14} />
                  <span>Select</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onCopy)}
                  title="Copy"
                  aria-label="Copy"
               >
                  <Copy size={14} />
                  <span>Copy</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onCut)}
                  title="Cut"
                  aria-label="Cut"
               >
                  <Scissors size={14} />
                  <span>Cut</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onPaste)}
                  title="Paste"
                  aria-label="Paste"
               >
                  <Clipboard size={14} />
                  <span>Paste</span>
               </button>

               <span className="status-bar__action-sep" />

               <button
                  type="button"
                  className="status-bar__action-btn status-bar__action-btn--char"
                  onClick={() => runAction(onInsertComma)}
                  title="Insert ,"
                  aria-label="Insert comma"
               >
                  <span className="status-bar__action-char">,</span>
                  <span>Comma</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onInsertBrackets)}
                  title='Insert [ ]'
                  aria-label='Insert brackets'
               >
                  <Brackets size={14} />
                  <span>Bracket</span>
               </button>

               <button
                  type="button"
                  className="status-bar__action-btn"
                  onClick={() => runAction(onInsertQuotes)}
                  title='Insert " "'
                  aria-label='Insert quotes'
               >
                  <Quote size={14} />
                  <span>Quote</span>
               </button>
            </div>
         </div>
      );
   }

   /* ===================== MODE NORMAL ===================== */
   return (
      <div className="status-bar">
         {/* ---------- Wrench toggle (paling kiri) ---------- */}
         <div className="status-bar__actions">
            <button
               type="button"
               className="status-bar__actions-btn"
               onClick={() => setActionsMode(true)}
               title="Aksi editor"
               aria-label="Aksi editor"
            >
               <Wrench size={12} />
            </button>
         </div>

         <span className="status-bar__sep" />

         <div className="status-bar__lang" ref={rootRef}>
            <button
               type="button"
               className="status-bar__lang-btn"
               onClick={() => setOpen((v) => !v)}
               title={`Bahasa: ${language.label}${languageOverride ? ' (manual)' : ' (auto)'}`}
               aria-haspopup="listbox"
               aria-expanded={open}
            >
               <CurrentIcon
                  size={12}
                  className="status-bar__lang-icon"
                  style={language.color ? { color: language.color } : undefined}
               />
               <span className="status-bar__lang-label">{language.short}</span>
               {languageOverride && (
                  <span className="status-bar__lang-dot" aria-hidden="true" />
               )}
            </button>

            {open && (
               <div className="status-bar__lang-menu" role="listbox">
                  <button
                     type="button"
                     className={`status-bar__lang-item ${languageOverride === null ? 'is-active' : ''}`}
                     onClick={() => {
                        onChangeLanguage(null);
                        setOpen(false);
                     }}
                     role="option"
                     aria-selected={languageOverride === null}
                  >
                     <autoLanguage.Icon
                        size={12}
                        style={autoLanguage.color ? { color: autoLanguage.color } : undefined}
                     />
                     <span className="status-bar__lang-item-label">
                        Auto ({autoLanguage.short})
                     </span>
                     {languageOverride === null && (
                        <Check size={12} className="status-bar__lang-check" />
                     )}
                  </button>

                  <div className="status-bar__lang-divider" />

                  {LANGS.map((def) => {
                     const active = languageOverride === def.id;
                     const DefIcon = def.Icon;
                     return (
                        <button
                           key={def.id}
                           type="button"
                           className={`status-bar__lang-item ${active ? 'is-active' : ''}`}
                           onClick={() => {
                              onChangeLanguage(def.id);
                              setOpen(false);
                           }}
                           role="option"
                           aria-selected={active}
                        >
                           <DefIcon
                              size={12}
                              style={def.color ? { color: def.color } : undefined}
                           />
                           <span className="status-bar__lang-item-label">{def.label}</span>
                           {active && (
                              <Check size={12} className="status-bar__lang-check" />
                           )}
                        </button>
                     );
                  })}
               </div>
            )}
         </div>

         {(hasErrors || hasWarnings) && (
            <>
               <span className="status-bar__sep" />
               {hasErrors && (
                  <span className="status-bar__item status-bar__item--error">
                     ✕ {errors}
                  </span>
               )}
               {hasWarnings && (
                  <span className="status-bar__item status-bar__item--warning">
                     ⚠ {warnings}
                  </span>
               )}
            </>
         )}

         <span className="status-bar__spacer" />

         <span className="status-bar__item">{lineCount} lines</span>

         <span className="status-bar__sep" />

         <span className="status-bar__item">{charCount} chars</span>

         <span className="status-bar__sep" />

         <span className="status-bar__item status-bar__item--pos">
            Ln {line}, Col {col}
         </span>
      </div>
   );
}