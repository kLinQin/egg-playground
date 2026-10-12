import { useEffect, useRef, useState } from 'react';
import {
   Check,
   Wrench,
   ClipboardCopy,
   Scissors,
   ClipboardPaste,
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
   onSelectAll: () => void;
   onCopy: () => void;
   onCut: () => void;
   onPaste: () => void;
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
   onSelectAll,
   onCopy,
   onCut,
   onPaste,
   onInsertBrackets,
   onInsertQuotes,
}: Props) {
   const hasErrors = errors > 0;
   const hasWarnings = warnings > 0;

   const [open, setOpen] = useState(false);
   const rootRef = useRef<HTMLDivElement>(null);

   const [actionsOpen, setActionsOpen] = useState(false);
   const actionsRef = useRef<HTMLDivElement>(null);

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

   /* close action menu on outside click */
   useEffect(() => {
      if (!actionsOpen) return;

      const onDocDown = (e: MouseEvent) => {
         if (
            actionsRef.current &&
            !actionsRef.current.contains(e.target as Node)
         ) {
            setActionsOpen(false);
         }
      };
      const onKey = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setActionsOpen(false);
      };

      document.addEventListener('mousedown', onDocDown);
      document.addEventListener('keydown', onKey);
      return () => {
         document.removeEventListener('mousedown', onDocDown);
         document.removeEventListener('keydown', onKey);
      };
   }, [actionsOpen]);

   const runAction = (fn: () => void) => {
      setActionsOpen(false);
      /* beri kesempatan dropdown menutup dulu, baru jalankan */
      window.setTimeout(fn, 0);
   };

   const CurrentIcon = language.Icon;

   return (
      <div className="status-bar">
         <span className="status-bar__item">
            Ln {line}, Col {col}
         </span>

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

         {/* ---------- mobile action bar ---------- */}
         <div className="status-bar__actions" ref={actionsRef}>
            <button
               type="button"
               className={`status-bar__actions-btn ${actionsOpen ? 'is-active' : ''}`}
               onClick={() => setActionsOpen((v) => !v)}
               title="Aksi editor"
               aria-haspopup="menu"
               aria-expanded={actionsOpen}
            >
               <Wrench size={12} />
            </button>

            {actionsOpen && (
               <div className="status-bar__actions-menu" role="menu">
                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onSelectAll)}
                     role="menuitem"
                  >
                     <Check size={14} />
                     <span>Select All</span>
                  </button>
                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onCopy)}
                     role="menuitem"
                  >
                     <ClipboardCopy size={14} />
                     <span>Copy</span>
                  </button>
                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onCut)}
                     role="menuitem"
                  >
                     <Scissors size={14} />
                     <span>Cut</span>
                  </button>
                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onPaste)}
                     role="menuitem"
                  >
                     <ClipboardPaste size={14} />
                     <span>Paste</span>
                  </button>

                  <div className="status-bar__actions-divider" />

                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onInsertBrackets)}
                     role="menuitem"
                  >
                     <Brackets size={14} />
                     <span>Insert [ ]</span>
                  </button>
                  <button
                     type="button"
                     className="status-bar__actions-item"
                     onClick={() => runAction(onInsertQuotes)}
                     role="menuitem"
                  >
                     <Quote size={14} />
                     <span>Insert " "</span>
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}